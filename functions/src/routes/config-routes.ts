export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const logger = require("../middleware/logger");

const getFunctions = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
})
	.https.onCall(async (data: any, context: CallableContext) => {
		logger.logFunctionInvocation(context, data);

		return (await db.collection('config').doc('functions').get()).data().items
	});

module.exports = {
	getFunctions: getFunctions,
}
