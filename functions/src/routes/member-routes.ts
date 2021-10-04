export {}

import {CallableContext} from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
import {gql, GraphQLClient} from 'graphql-request'
const config = require("../config");
const logger = require("../middleware/logger");

const MemberDoesNotExistException = new functions.https.HttpsError('not-found', "Member not found",
  {message: "This member has not been added to the system."})

const getProfileInformation = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);
  if(!await AuthService.canView(context, data.email)) throw AuthService.exceptions.NotAuthorizedException

  const email = data.email;

  const member = await db.collection('members').doc(email).get();
  if (!member.exists) throw MemberDoesNotExistException;

  const expa_data = await getMemberExpaInfo(email, member.data().expa_id);

  return {
    email: email,
    expa_id: member.data().expa_id,
    photo: member.data().photo ?
      await admin.storage().bucket("aiesec-hris.appspot.com").file(member.data().photo).getSignedUrl(
        { action: 'read', expires: "01-01-2500" }
      ) :
      "https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png",
    cv: member.data().cv ?
      await admin.storage().bucket("aiesec-hris.appspot.com").file(member.data().cv).getSignedUrl(
        { action: 'read', expires: "01-01-2500" }
      ) : null,
    social_media: member.data().social_media,
    current_status: member.data().current_status ? member.data().current_status.toUpperCase() : "UNKNOWN",
    tags: member.data().tags,
    dob: member.data().dob,
    faculty: member.data().faculty,
    field_of_study: member.data().field_of_study,
    joined_date: member.data().joined_date,
    phone: member.data().phone,
    attachments: member.data().attachments,
    unofficial_positions: member.data().unofficial_positions,
    ...expa_data
  };
});

const addAdditionalInformation = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);

  const email = context.auth?.token.email;
  await db.collection('members').doc(email).set(data, {merge: true});
  await db.collection('users').doc(email).set({profile_created: true}, {merge: true});
});

const inviteMember = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);

  if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

  const entity = (await getMemberExpaInfo(data.email, data.expa_id)).entity;
  const userEntity = await AuthService.getCurrentUserEntity(context);
  console.log(entity, userEntity);
  if (!(await AuthService.getCurrentUserRoles(context)).includes("admin") && entity != userEntity)
    throw AuthService.exceptions.NotAuthorizedException

  const docRef = await db.collection("users").doc(data.email).get();
  if (docRef.exists) {
    await db.collection('users').doc(data.email).set({
      entity: entity
    }, {merge: true});
  } else {
    await db.collection('users').doc(data.email).set({
      entity: entity,
      role: ["member"]
    }, {merge: true});

  }
});

const changeCurrentStatus = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);

  if(!await AuthService.canSuperEdit(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
  const email = data.email;
  await db.collection('members').doc(email).set(data, {merge: true});
});

const editProfileField = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);

  if(!await AuthService.canEdit(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
  const privilegedEdits = ["expa_id", "email", "entity", "tags", "current_status"];
  if (privilegedEdits.includes(data.editField)) {
    if(!await AuthService.canSuperEdit(context, data.email)) throw AuthService.exceptions.NotAuthorizedException
  }

  const edits = createNestedObject(data.editField.split("."), data.newValue);
  await db.collection('members').doc(data.email).set(edits, {merge: true});
});

const getMembers = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);

  if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

  let members;
  if (await AuthService.isAdmin(context)) members = await db.collection('members').orderBy("name", 'asc');
  else members = await db.collection('members')
    .where("entity", "==", await AuthService.getEntity(context))
    .orderBy("name", 'asc');

  let result: any[] = [];
  const querySnapshot = await members.get();
  querySnapshot.forEach((doc: any) => {
    result.push(doc.data());
  })
  return result;
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
    {headers: {authorization: config.expa_access_token}})

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

  await db.collection('members').doc(email).set(expa_data, {merge: true});
  return expa_data;
}

function createNestedObject(names: string[], value: string ) {
  var obj = {};
  var base = obj;

  // If a value is given, remove the last name and keep it for later:
  var lastName = names.pop();

  // Walk the hierarchy, creating new objects where needed.
  // If the lastName was removed, then the last object is not set yet:
  for( var i = 0; i < names.length; i++ ) {
    // @ts-ignore
    base = base[ names[i] ] = base[ names[i] ] || {};
  }

  // If a value was given, set it to the last name:
  if( lastName ) { // @ts-ignore
    base = base[ lastName ] = value;
  }

  // Return the last object in the hierarchy:
  return obj;
};

module.exports = {
  getProfileInformation: getProfileInformation,
  addAdditionalInformation: addAdditionalInformation,
  inviteMember: inviteMember,
  changeCurrentStatus: changeCurrentStatus,
  editProfileField: editProfileField,
  getMembers: getMembers
}
