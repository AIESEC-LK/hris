export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const ResourceService = require("../services/resource-service");
const logger = require("../middleware/logger");
const { BigQuery } = require('@google-cloud/bigquery');

export interface Resource {
	id: string,
	title: string,
	url: string,
	link: string,
	functions: string[],
	keywords: string[],
	count?: number
}

const ResourceAlreadyExistsException = new functions.https.HttpsError('already-exists', "Resource already exists.",
	{ message: "A resource with this title already exists." })
const ResourceDoesNotExistException = new functions.https.HttpsError('not-found', "Resource does not exist.",
	{ message: "This resource does not exist." })


const createResource = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Resource, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const unique_id = makeUrlFriendly(data.url);
	if (await checkResourceExists(unique_id)) throw ResourceAlreadyExistsException;

	await db.collection('resources').doc(unique_id).set(
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

const getResource = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await ResourceService.canView(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	const id = data.id;

	const opportunityRef = await db.collection('resources').doc(id).get();
	if (!opportunityRef.exists) throw ResourceDoesNotExistException;

	const resource: Resource = opportunityRef.data();
	return resource
});

const getResources = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	await AuthService.checkLoggedIn(context);

	let resources;
	if (await AuthService.isAdmin(context)) resources = await db.collection('resources')
		.orderBy("created_at", 'desc');
	else resources = await db.collection('resources')
		.where("entity", "in", [await AuthService.getEntity(context), "Sri Lanka"])
		.orderBy("created_at", 'desc');

	let resultMap = new Map<string, Resource>();
	let ids: string[] = [];
	const querySnapshot = await resources.get()
	querySnapshot.forEach((doc: any) => {
		resultMap.set(doc.id, doc.data());
		ids.push("\"" + doc.id + "\"");
	});


	if (AuthService.checkPrivileged(context)) {
		const query = `SELECT id, count FROM aiesec-hris.analytics_285407858.resource_events_summary WHERE id IN (${ids})`;

		const options = {
			keyFilename: 'bq-service-account.json',
			projectId: 'aiesec-hris',
			query: query

		};
		const bqClient = new BigQuery();
		const [rows] = await bqClient.query(options);
		rows.forEach((row: any) => {
			resultMap.get(row.id)!.count = row.count;
		});
	}

	let result: Resource[] = [];
	for (const resource of resultMap.values()) {
		result.push(resource);
	}
	return result;
});

const editResource = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Resource, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await ResourceService.canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkResourceExists(data.id)) throw ResourceDoesNotExistException;

	await db.collection('resources').doc(data.id).set(
		{
			...data,
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
		}, { merge: true });

	return data.id;
});

const deleteResource = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Resource, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await ResourceService.canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkResourceExists(data.id)) throw ResourceDoesNotExistException;

	await db.collection('resources').doc(data.id).delete();
	return;
});


function makeUrlFriendly(value: string) {
	return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function checkResourceExists(id: string): Promise<boolean> {
	const docRef = await db.collection('resources').doc(id);
	const docSnapshot = await docRef.get();
	return !!docSnapshot.exists;
}

module.exports = {
	createResource: createResource,
	getResource: getResource,
	getResources: getResources,
	editResource: editResource,
	deleteResource: deleteResource
}
