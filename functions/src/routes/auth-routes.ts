export { }

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");

const completeLogin = functions
	.runWith({
		timeoutSeconds: 30,
		memory: "8GB",
	})
	.https.onCall(async (data: any, context: any) => {
		logger.logFunctionInvocation(context, data);

		await AuthService.checkLoggedIn(context);

		const email = context.auth?.token.email;
		const uid = context.auth?.uid;

		if (!email || !uid) {
			await admin.auth().deleteUser(context.auth?.uid);
			return AuthService.exceptions.NotAuthorizedException;
		}

		let userTokens;
		try {
			userTokens = await db.collection('users').doc(email).get();
		} catch (e) {
			await admin.auth().deleteUser(context.auth?.uid);
			throw AuthService.exceptions.NotAuthorizedException;
		}

		if (!userTokens.exists) {
			await admin.auth().deleteUser(context.auth?.uid);
			throw AuthService.exceptions.NotAuthorizedException;
		}
		await admin.auth().setCustomUserClaims(uid, { email: email, ...userTokens.data() });

		return {
			tokens: { email: email, ...userTokens.data() }
		};
	});

module.exports = {
	completeLogin: completeLogin
}
