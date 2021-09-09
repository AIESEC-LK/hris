import * as functions from "firebase-functions";
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();
const config = require("../src/config");
import { GraphQLClient, gql } from 'graphql-request'


exports.setUserTokens = functions.https.onCall(async (data, context) => {
  const email = context.auth?.token.email;
  const uid = context.auth?.uid;

  const NotLoggedInException = new functions.https.HttpsError('unauthenticated', "Not logged in",
    {message: "You are not logged in."})
  const NotAuthorizedException = new functions.https.HttpsError('unauthenticated', "Not authorized",
    {message: "You are not authorized to access the system."})


  if (email == null || uid == null) throw NotLoggedInException;
  const userTokens = await db.collection('users').doc(email).get();

  if (!userTokens.exists) throw NotAuthorizedException;
  await admin.auth().setCustomUserClaims(uid, {});
  await admin.auth().setCustomUserClaims(uid, userTokens.data());

  return userTokens.data();
});

exports.getProfileInformation = functions.https.onCall(async (data, context) => {
  const email = data.email;

  const UserDoesNotExistException = new functions.https.HttpsError('not-found', "Member not found",
    {message: "This member has not been added to the system."})

  const member = await db.collection('members').doc(email).get();
  if (!member.exists) throw UserDoesNotExistException;


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
      }
    }
  `

  const variables = {
    id: member.data().expaID
  }

  // ... or create a GraphQL client instance to send requests
  const client = new GraphQLClient("https://gis-api.aiesec.org/graphql",
    { headers: {authorization: config.expa_access_token} })

  const queryResult = await client.request(query, variables);
  return queryResult;

  return member.data();
  //return ["hello", config.expa_access_token];
});


