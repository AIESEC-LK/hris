export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const OpportunityService = require("../services/opportunity-service");
const logger = require("../middleware/logger");

export interface Opportunity {
	id: string,
	title: string,
	url: string,
	photo: string,
	description: string,
	link: string,
	deadline: string,
	schedule?: string,
	entity: string
}

const OpportunityAlreadyExistsException = new functions.https.HttpsError('already-exists', "Opportunity already exists.",
	{ message: "An opportunity with this title already exists." })
const OpportunityDoesNotExistException = new functions.https.HttpsError('not-found', "Opportunity does not exist.",
	{ message: "This opportunity does not exist." })


const createOpportunity = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Opportunity, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const unique_id = makeUrlFriendly(data.url);
	if (await checkOpportunityExists(unique_id)) throw OpportunityAlreadyExistsException;

	await db.collection('opportunities').doc(unique_id).set(
		{
			...data,
			entity: await AuthService.getEntity(context),
			created_by: await AuthService.getEmail(context),
			created_at: logger.getSLTimestamp(),
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
			id: unique_id
		}, { merge: true });

	return unique_id;
});

const getOpportunity = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await OpportunityService.canView(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	const id = data.id;

	const opportunityRef = await db.collection('opportunities').doc(id).get();
	if (!opportunityRef.exists) throw OpportunityDoesNotExistException;

	const opportunity: Opportunity = opportunityRef.data();

	return getOpportunityFromData(opportunity);
});

const getOpportunities = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);

	let opportunities;

	try {
		await AuthService.checkLoggedIn(context);
		if (await AuthService.isAdmin(context)) opportunities = await db.collection('opportunities')
			.where("deadline", ">=", logger.getCurrentDate())
			.orderBy("deadline", "asc")
			.orderBy("created_at", 'desc');
		else opportunities = await db.collection('opportunities')
			.where("deadline", ">=", logger.getCurrentDate())
			.orderBy("deadline", "asc")
			.where("entity", "in", [await AuthService.getEntity(context), "Sri Lanka"])
			.orderBy("created_at", 'desc');
	} catch (e) {
		opportunities = await db.collection('opportunities')
			.where("deadline", ">=", logger.getCurrentDate())
			.orderBy("deadline", "asc")
			.where("entity", "in", ["Sri Lanka"])
			.orderBy("created_at", 'desc');
	}

	let result: Opportunity[] = [];
	const querySnapshot = await opportunities.get()
	querySnapshot.forEach((doc: any) => {
		const schedule = doc.data().schedule;
		console.log(doc.data().title, schedule);
		if (!schedule || schedule <= logger.getSLTimestamp().replace(" ", "T")) result.push(doc.data());
	});

	for (let i = 0; i < result.length; i++) {
		result[i] = await getOpportunityFromData(result[i]);
	}

	return result;
});


const editOpportunity = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Opportunity, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await OpportunityService.canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	console.log(data);
	if (!await checkOpportunityExists(data.id)) throw OpportunityDoesNotExistException;

	await db.collection('opportunities').doc(data.id).set(
		{
			...data,
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
		}, { merge: true });

	return data.id;
});


function makeUrlFriendly(value: string) {
	return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function checkOpportunityExists(id: string): Promise<boolean> {
	const docRef = await db.collection('opportunities').doc(id);
	const docSnapshot = await docRef.get();
	return !!docSnapshot.exists;
}

async function getOpportunityFromData(opportunity: Opportunity): Promise<Opportunity> {
	return {
		id: opportunity.id,
		title: opportunity.title,
		url: opportunity.url,
		photo: opportunity.photo ?
			await admin.storage().bucket("aiesec-hris.appspot.com").file(opportunity.photo).getSignedUrl(
				{ action: 'read', expires: "01-01-2500" }
			) :
			"https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png",
		description: opportunity.description,
		deadline: opportunity.deadline,
		schedule: opportunity.schedule,
		link: opportunity.link,
		entity: opportunity.entity
	};
}

const deleteOpportunity = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Opportunity, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await OpportunityService.canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkOpportunityExists(data.id)) throw OpportunityDoesNotExistException;

	await db.collection('opportunities').doc(data.id).delete();
	return;
});

module.exports = {
	createOpportunity: createOpportunity,
	getOpportunity: getOpportunity,
	editOpportunity: editOpportunity,
	getOpportunities: getOpportunities,
	deleteOpportunity: deleteOpportunity
}
