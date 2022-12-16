export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
import { gql, GraphQLClient } from 'graphql-request'
const config = require("../config");
const logger = require("../middleware/logger");
const utils = require("../utils");

const MemberDoesNotExistException = new functions.https.HttpsError('not-found', "Member not found",
	{ message: "This member has not been added to the system." })
const GroupDoesNotExistException = new functions.https.HttpsError('not-found', "Group not found",
	{ message: "This group does not exist." })

const getProfileInformation = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.canView(context, data.email)) throw AuthService.exceptions.NotAuthorizedException

	const email = data.email;

	const member = await db.collection('members').doc(email).get();
	if (!member.exists) throw MemberDoesNotExistException;

	let expa_data = {
		positions: member.data().positions,
		name: member.data().name,
		gender: member.data().gender,
		entity: member.data().entity
	}

	try {
		if (data.refresh) expa_data = await getMemberExpaInfo(email, member.data().expa_id);
	} catch (e) {
		logger.logWarning(context, {
			message: "Member does not exist on EXPA",
			...data
		})
	}

	let sensitive_data = {};
	if (await AuthService.canEdit(context, data.email)) sensitive_data = {
		phone: member.data().phone,
		phone2: member.data().phone2,
		address: member.data().address,
		dob: member.data().dob,
		cv: member.data().cv ?
			await admin.storage().bucket("aiesec-hris.appspot.com").file(member.data().cv).getSignedUrl(
				{ action: 'read', expires: "01-01-2500" }
			) : null,
	}

	return {
		email: email,
		expa_id: member.data().expa_id,
		photo: member.data().photo ?
			await admin.storage().bucket("aiesec-hris.appspot.com").file(member.data().photo).getSignedUrl(
				{ action: 'read', expires: "01-01-2500" }
			) :
			"https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png",
		social_media: member.data().social_media,
		current_status: member.data().current_status ? member.data().current_status.toUpperCase() : "UNKNOWN",
		tags: member.data().tags,
		faculty: member.data().faculty,
		field_of_study: member.data().field_of_study,
		joined_date: member.data().joined_date,
		attachments: member.data().attachments,
		unofficial_positions: member.data().unofficial_positions,
		...sensitive_data,
		...expa_data
	};
});

const addAdditionalInformation = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);

	const email = context.auth?.token.email;
	await db.collection('members').doc(email).set(data, { merge: true });
	await db.collection('users').doc(email).set({ profile_created: true }, { merge: true });
});

const inviteMember = functions.https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);

	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const userEntity = await AuthService.getCurrentUserEntity(context);
	let entity = userEntity;

	if (data.expa_id) {
		entity = (await getMemberExpaInfo(data.email, data.expa_id)).entity;
	}

	if (!(await AuthService.getCurrentUserRoles(context)).includes("admin") && entity != userEntity)
		throw AuthService.exceptions.NotAuthorizedException

	const docRef = await db.collection("users").doc(data.email).get();
	if (docRef.exists) {
		await db.collection('users').doc(data.email).set({
			entity: entity
		}, { merge: true });
	} else {
		await db.collection('users').doc(data.email).set({
			entity: entity,
			role: ["member"]
		}, { merge: true });
	}

	await db.collection('members').doc(data.email).set({
		email: data.email,
		expa_id: data.expa_id,
		current_status: "ACTIVE",
		entity: entity,
		name: data.name
	}, { merge: true });

});

const changeCurrentStatus = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);

	if (!await AuthService.canSuperEdit(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
	const email = data.email;
	await db.collection('members').doc(email).set(data, { merge: true });
});

const editProfileField = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);

	if (!await AuthService.canEditGroup(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
	const privilegedEdits = ["expa_id", "email", "entity", "tags", "current_status"];
	if (privilegedEdits.includes(data.editField)) {
		if (!await AuthService.canSuperEdit(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
	}

	const edits = createNestedObject(data.editField.split("."), data.newValue);
	await db.collection('members').doc(data.email).set(edits, { merge: true });
});

const getMembers = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	//if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	let members;
	if (await AuthService.isAdmin(context)) members = await db.collection('members').orderBy("name", 'asc');
	else members = await db.collection('members')
		.where("entity", "==", await AuthService.getEntity(context))
		.orderBy("name", 'asc');

	let result: any[] = [];
	const querySnapshot = await members.get();
	const canAccessSensitive = await AuthService.isEBOrAbove(context);

	querySnapshot.forEach((doc: any) => {

		const data = {
			name: doc.data().name,
			email: doc.data().email ? doc.data().email : doc.id,
			current_status: doc.data().current_status,
			positions: doc.data().positions,
			unofficial_positions: doc.data().unofficial_positions,
			entity: doc.data().entity,
			expa_id: doc.data().expa_id,
			tags: doc.data().tags,
			faculty: doc.data().faculty,
		}

		let sensitive_data = {};
		if (canAccessSensitive) sensitive_data = {
			phone: doc.data().phone,
			phone2: doc.data().phone2,
			address: doc.data().address,
			dob: doc.data().dob,
			gender: doc.data().gender
		}

		result.push({ ...data, ...sensitive_data });
	})

	return result;
});

const getMembersManage = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	let members;
	if (await AuthService.isAdmin(context)) members = await db.collection('members').orderBy("name", 'asc');
	else members = await db.collection('members')
		.where("entity", "==", await AuthService.getEntity(context))
		.orderBy("name", 'asc');

	const querySnapshot = await members.get();

	let users;
	if (await AuthService.isAdmin(context)) users = await db.collection('users');
	else users = await db.collection('users').where("entity", "==", await AuthService.getEntity(context));

	let userIsAdminMap = new Map();
	const usersSnapshot = await users.get();
	usersSnapshot.forEach((doc: any) => {
		let roles: string[] = doc.data().role;
		let isAdmin: boolean = false;
		if (roles.includes("eb") || roles.includes("admin")) isAdmin = true;
		userIsAdminMap.set(doc.id, isAdmin);
	})

	let result: any[] = [];

	querySnapshot.forEach((doc: any) => {

		const data = {
			name: doc.data().name,
			email: doc.data().email ? doc.data().email : doc.id,
			expa_id: doc.data().expa_id,
			positions: doc.data().positions,
			unofficial_positions: doc.data().unofficial_positions,
			entity: doc.data().entity,
			isAdmin: userIsAdminMap.has(doc.data().email) ? userIsAdminMap.get(doc.data().email) : false
		}

		result.push(data);
	})

	return result;
});

const makeEB = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const doc = db.collection('users').doc(data.email);
	const user = (await doc.get()).data();

	if (!await AuthService.isAdmin(context) && user.entity != await AuthService.getEntity(context))
		throw AuthService.exceptions.NotAuthorizedException;

	let roles: string[] = user.role;
	if (!roles.includes("eb")) roles.push("eb")

	await doc.set({ role: roles }, { merge: true });
	return;
});

const revokeEB = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const doc = db.collection('users').doc(data.email);
	const user = (await doc.get()).data();

	if (!await AuthService.isAdmin(context) && user.entity != await AuthService.getEntity(context))
		throw AuthService.exceptions.NotAuthorizedException;

	let roles: string[] = user.role;
	if (roles.includes("eb")) roles.splice(roles.indexOf("eb"), 1);

	await doc.set({ role: roles }, { merge: true });
	return;
});

const getGroup = functions.https.onCall(async (data: GetGroupRequest, context: CallableContext): Promise<MemberGroup> => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException;
	if (!await canEditGroup(context, data.id)) throw AuthService.exceptions.NotAuthorizedException;

	const res = (await db.collection('groups').doc(data.id).get()).data();

	return {
		id: data.id,
		name: res.name,
		members: res.members
	}
});

const getGroups = functions.https.onCall(async (data: any, context: CallableContext): Promise<MemberGroup[]> => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException;

	let result: MemberGroup[] = [];

	let allActiveMembersSnapshot;
	if (await AuthService.isAdmin(context)) {
		allActiveMembersSnapshot = await db.collection("members")
			.where("current_status", "==", "ACTIVE");
	} else {
		allActiveMembersSnapshot = await db.collection("members")
			.where("entity", "==", await AuthService.getEntity(context))
			.where("current_status", "==", "ACTIVE");
	}
	let querySnapshot = await allActiveMembersSnapshot.get();
	const allActiveMembers: string[] = [];
	querySnapshot.forEach((doc: any) => {
		allActiveMembers.push(doc.id);
	});
	result.push({
		id: "ActiveMembers",
		name: "Active Members",
		members: allActiveMembers
	});

	const groups = await db.collection('groups')
		.where("entity", "==", await AuthService.getEntity(context))
		.orderBy("last_updated_at", 'desc');
	querySnapshot = await groups.get();
	querySnapshot.forEach((doc: any) => {
		result.push({
			id: doc.id,
			name: doc.data().name,
			members: doc.data().members
		})
	})

	return result;

});

const createGroup = functions.https.onCall(async (data: CreateGroupRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const userEntity = await AuthService.getCurrentUserEntity(context);
	const groupId = utils.makeUrlFriendly(`${userEntity}-${data.name}`);

	await db.collection('groups').doc(groupId).set({
		name: data.name,
		members: data.members,
		created_by: await AuthService.getEmail(context),
		created_at: logger.getSLTimestamp(),
		last_updated_by: await AuthService.getEmail(context),
		last_updated_at: logger.getSLTimestamp(),
		entity: userEntity,
	}, { merge: true });

});

const editGroup = functions.https.onCall(async (data: EditGroupRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException
	if (!await canEditGroup(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	await db.collection('groups').doc(data.id).set({
		name: data.name,
		members: data.members,
		last_updated_by: await AuthService.getEmail(context),
		last_updated_at: logger.getSLTimestamp(),
	}, { merge: true });
});


const deleteGroup = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: DeleteGroupRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await checkGroupExists(data.id)) throw GroupDoesNotExistException;
	if (!await canEditGroup(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	await db.collection('groups').doc(data.id).delete();
	return;
});

async function getMemberExpaInfo(email: any, expa_id: any) {
	const query = gql`
    query PeopleHomeQuery($id: ID!) {
		getPerson(id: $id) {
			id
			full_name
			gender
			created_at
        home_lc {
				name
			}
        member_positions {
				function {
					name
				}
				start_date
				end_date
            office {
					name
				}
            role {
					name
				}
            committee_department {
					name
				}
			}
        positions {
            office {
					name
				}
				function {
					name
				}
				position_name
				start_date
				end_date
			}
		}
	}
		`

	const variables = {
		id: expa_id
	}

	// ... or create a GraphQL client instance to send requests
	const client = new GraphQLClient("https://gis-api.aiesec.org/graphql",
		{ headers: { authorization: config.expa_access_token } })

	let queryResult;
	try {
		queryResult = await client.request(query, variables);
	} catch (e) {
		throw MemberDoesNotExistException;
	}

	let positions = [];
	for (let position of queryResult.getPerson.member_positions) {
		if (position.committee_department && position.committee_department.name.includes("-"))
			position.committee_department.name = position.committee_department.name.split(" - ")[0];
		const p = {
			name: position.role.name,
			start_date: position.start_date,
			end_date: position.end_date,
			function: position.committee_department ? position.committee_department.name : null,
			entity: position.office.name
		}
		positions.push(p);
	}

	/*for (let position of queryResult.getPerson.positions) {
	  if (position.function && position.function.name.includes("-")) position.function.name = position.function.name.split(" - ")[0];
	  const p = {
		name: position.position_name,
		start_date: position.start_date.split("T")[0],
		end_date: position.end_date.split("T")[0],
		function: position.function ? position.function.name : null,
		entity: position.office.name
	  }
	  positions.push(p);
	}*/


	const expa_data = {
		name: queryResult.getPerson.full_name,
		gender: queryResult.getPerson.gender,
		entity: queryResult.getPerson.home_lc.name,
		positions: positions
	};

	console.log(expa_data);

	await db.collection('members').doc(email).set(expa_data, { merge: true });
	return expa_data;
}

function createNestedObject(names: string[], value: string) {
	var obj = {};
	var base = obj;

	// If a value is given, remove the last name and keep it for later:
	var lastName = names.pop();

	// Walk the hierarchy, creating new objects where needed.
	// If the lastName was removed, then the last object is not set yet:
	for (var i = 0; i < names.length; i++) {
		// @ts-ignore
		base = base[names[i]] = base[names[i]] || {};
	}

	// If a value was given, set it to the last name:
	if (lastName) { // @ts-ignore
		base = base[lastName] = value;
	}

	// Return the last object in the hierarchy:
	return obj;
}

module.exports = {
	getProfileInformation: getProfileInformation,
	addAdditionalInformation: addAdditionalInformation,
	inviteMember: inviteMember,
	changeCurrentStatus: changeCurrentStatus,
	editProfileField: editProfileField,
	getMembers: getMembers,
	getMembersManage: getMembersManage,
	makeEB: makeEB,
	revokeEB: revokeEB,
	getGroups: getGroups,
	getGroup: getGroup,
	createGroup: createGroup,
	editGroup: editGroup,
	deleteGroup: deleteGroup
}

interface MemberGroup {
	id: string,
	name: string,
	members: string[]
}

interface GetGroupRequest {
	id: string
}

interface DeleteGroupRequest {
	id: string
}

interface CreateGroupRequest {
	name: string,
	members: string[]
}

interface EditGroupRequest extends CreateGroupRequest {
	id: string
}

async function canEditGroup(context: CallableContext, id: string): Promise<boolean> {
	const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

	// if current user is an admin, obviously can see all.
	if (currentUserRoles.includes("admin")) return true;

	// Current user must be EB or above and from the same entity.
	if (!currentUserRoles.includes("eb")) return false;
	const targetEntity = (await db.collection('groups').doc(id).get()).data().entity;
	if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

	return false;
}

async function checkGroupExists(id: string): Promise<boolean> {
	const docRef = await db.collection('groups').doc(id);
	const docSnapshot = await docRef.get();
	return !!docSnapshot.exists;
}
