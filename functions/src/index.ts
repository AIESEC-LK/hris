import * as functions from "firebase-functions";
const admin = require('firebase-admin');
admin.initializeApp();
const db = admin.firestore();

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

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

