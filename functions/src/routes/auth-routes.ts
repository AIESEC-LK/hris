export {}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");

const completeLogin = functions.https.onCall(async (data:any, context:any) => {
  await AuthService.checkLoggedIn(context);

  const email = context.auth?.token.email;
  const uid = context.auth?.uid;

  const userTokens = await db.collection('users').doc(email).get();
  console.log("Email", email);
  console.log("User Tokens", userTokens.data());
  console.log("UID", uid);

  if (!userTokens.exists) throw module.exports.NotAuthorizedException;
  await admin.auth().setCustomUserClaims(uid, {});
  await admin.auth().setCustomUserClaims(uid, userTokens.data());

  console.log((await admin.auth().getUser(uid)).customClaims);

  return {
    tokens: userTokens.data()
  };
});

module.exports = {
  completeLogin: completeLogin
}
