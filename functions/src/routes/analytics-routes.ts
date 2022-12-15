const functions = require('firebase-functions');
const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");
const {BigQuery} = require('@google-cloud/bigquery');

export interface EventSummaryRequest {
	id: string
}

const getEventSummary = functions
	.runWith({
		timeoutSeconds: 30,
		memory: "8GB",
	})
	.https.onCall(async (data: EventSummaryRequest, context: any) => {
		logger.logFunctionInvocation(context, data);

		if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException;

		const options = {
			keyFilename: 'bq-service-account.json',
			projectId: 'aiesec-hris',
			query: `SELECT event_name, count FROM aiesec-hris.analytics_285407858.opportunity_events_summary WHERE id = "${data.id}"`

		};
		const bqClient = new BigQuery();
		const [rows] = await bqClient.query(options);
		return rows;
	});

module.exports = {
	getEventSummary: getEventSummary
}
