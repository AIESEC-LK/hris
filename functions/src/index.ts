import * as functions from "firebase-functions";
import {gql, GraphQLClient} from 'graphql-request'

const admin = require('firebase-admin');
var serviceAccount = require("../src/aiesec-hris-firebase-adminsdk-jm89q-69ea10c068.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://my-app.firebaseio.com"
});

const db = admin.firestore();
const config = require("../src/config");

const NotLoggedInException = new functions.https.HttpsError('unauthenticated', "Not logged in",
  {message: "You are not logged in."})
const NotAuthorizedException = new functions.https.HttpsError('unauthenticated', "Not authorized",
  {message: "You are not authorized to access this page."})
const MemberDoesNotExistException = new functions.https.HttpsError('not-found', "Member not found",
  {message: "This member has not been added to the system."})


exports.completeLogin = functions.https.onCall(async (data, context) => {
  const email = context.auth?.token.email;
  const uid = context.auth?.uid;

  if (email == null || uid == null) throw NotLoggedInException;
  const userTokens = await db.collection('users').doc(email).get();
  console.log("Email", email);
  console.log("User Tokens", userTokens.data());

  if (!userTokens.exists) throw NotAuthorizedException;
  await admin.auth().setCustomUserClaims(uid, {});
  await admin.auth().setCustomUserClaims(uid, userTokens.data());

  return {
    profile_created: false,
    tokens: userTokens.data()
  };
});

exports.getProfileInformation = functions.https.onCall(async (data, context) => {
  const tokenResult = await admin.auth().getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || tokenResult.customClaims["role"] != "admin") throw NotAuthorizedException;

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
    ...expa_data
  };

});

exports.addAdditionalInformation = functions.https.onCall(async (data, context) => {
  const email = context.auth?.token.email;
  await db.collection('members').doc(email).set(data, {merge: true});
});

exports.inviteMember = functions.https.onCall(async (data, context) => {
  const tokenResult = await admin.auth().getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || tokenResult.customClaims["role"] != "admin") throw NotAuthorizedException;

  await db.collection('users').doc(data.email).set({
    entity: data.entity,
    role: data.role,
  }, {merge: true});

  await db.collection('members').doc(data.email).set({
    expa_id: data.expa_id,
    current_status: "ACTIVE",
    email: data.email
  }, {merge: true});

  await getMemberExpaInfo(data.email, data.expa_id);
});

exports.changeCurrentStatus = functions.https.onCall(async (data, context) => {
  const tokenResult = await admin.auth().getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || tokenResult.customClaims["role"] != "admin") throw NotAuthorizedException;

  const email = data.email;
  await db.collection('members').doc(email).set(data, {merge: true});
});

exports.editProfileField = functions.https.onCall(async (data, context) => {
  const tokenResult = await admin.auth().getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || tokenResult.customClaims["role"] != "admin") throw NotAuthorizedException;

  const email = data.email;

  const edits = createNestedObject(data.editField.split("."), data.newValue);
  console.log("edits", edits);
  await db.collection('members').doc(email).set(edits, {merge: true});
});

exports.getMembers = functions.https.onCall(async (data, context) => {
  const tokenResult = await admin.auth().getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || tokenResult.customClaims["role"] != "admin") throw NotAuthorizedException;

  const members = await db.collection('members').orderBy("name", 'asc');

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
        dob
        created_at
        contact_detail {
            phone
        }
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
    if (position.function.name.includes("-")) position.function.name = position.function.name.split(" - ")[0];
    const p = {
      name: position.role.name,
      start_date: position.start_date,
      end_date: position.end_date,
      function: position.function.name,
      entity: position.office.name
    }
    positions.push(p);
  }

  const expa_data = {
    name: queryResult.getPerson.full_name,
    gender: queryResult.getPerson.gender,
    dob: queryResult.getPerson.dob,
    created_at: queryResult.getPerson.created_at,
    phone: queryResult.getPerson.contact_detail.phone,
    entity: queryResult.getPerson.home_lc.name,
    positions: positions
  };

  await db.collection('members').doc(email).set(expa_data, {merge: true});
  return expa_data;
}

var createNestedObject = function(names: string[], value: string ) {
  var obj = {};
  var base = obj;

  // If a value is given, remove the last name and keep it for later:
  var lastName = names.pop();

  // Walk the hierarchy, creating new objects where needed.
  // If the lastName was removed, then the last object is not set yet:
  for( var i = 0; i < names.length; i++ ) {
    // @ts-ignore
    base = base[ names[i] ] = base[ names[i] ] || {};
    console.log(base);
  }

  // If a value was given, set it to the last name:
  if( lastName ) { // @ts-ignore
    base = base[ lastName ] = value;
  }

  // Return the last object in the hierarchy:
  return obj;
};




