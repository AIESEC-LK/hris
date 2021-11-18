export {}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");

const completeLogin = functions.https.onCall(async (data:any, context:any) => {
  logger.logFunctionInvocation(context, data);

  await AuthService.checkLoggedIn(context);

  const email = context.auth?.token.email;
  const uid = context.auth?.uid;

  if (!email || !uid) return AuthService.exceptions.NotAuthorizedException;
  console.log("EMAIL", email);

  let userTokens;
  try {
    userTokens = await db.collection('users').doc(email).get();
  } catch (e) {
    throw AuthService.exceptions.NotAuthorizedException;
  }

  if (!userTokens.exists) throw AuthService.exceptions.NotAuthorizedException;
  await admin.auth().setCustomUserClaims(uid, userTokens.data());

  return {
    tokens: userTokens.data()
  };
});

module.exports = {
  completeLogin: completeLogin
}
