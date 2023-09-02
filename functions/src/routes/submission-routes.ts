export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const config = require("../config");

const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");
const SubmissionService = require("../services/submission-service");

export interface ResponseInfo {
	email: string,
	timestamp: string
}

export interface Submission {
	title: string,
	description: string,
	submissionLink: string,
	responsesLink: string,
	submitters: string[],
	deadline: string,
	id?: string,
	responseList?: String[]
}

const SubmissionAlreadyExistsException = new functions.https.HttpsError('already-exists', "Submission already exists.",
	{ message: "A submission with this title already exists." })
const NoResponseAccessException = new functions.https.HttpsError('permission-denied', "ASL360 does not have access to the responses sheet.",
	{ message: `Please provide view access to "${config.submissions_access_email}" to the responses sheet.` })
const SubmissionDoesNotExistException = new functions.https.HttpsError('not-found', "Submission does not exist.",
	{ message: "This submission does not exist." })


const createSubmission = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Submission, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	const unique_id = makeUrlFriendly(data.title);
	if (await checkSubmissionExists(unique_id)) throw SubmissionAlreadyExistsException;

	if (!(await SubmissionService.hasResponsesAccess(data.responsesLink))) throw NoResponseAccessException;

	await db.collection('submissions').doc(unique_id).set(
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

const getSubmission = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await SubmissionService.canView(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	const id = data.id;

	const submissionRef = await db.collection('submissions').doc(id).get();
	if (!submissionRef.exists) throw SubmissionDoesNotExistException;

	const submission: Submission = submissionRef.data();

	if (await SubmissionService.canEdit(context, data.id)) {
		if (!await SubmissionService.hasResponsesAccess(submission.responsesLink)) throw NoResponseAccessException;
		submission['responseList'] = await SubmissionService.getResponseList(submission);
	}

	return submission
});

const editSubmission = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Submission, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await SubmissionService.canEdit(context, data.id!)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkSubmissionExists(data.id!)) throw SubmissionDoesNotExistException;

	await db.collection('submissions').doc(data.id!).set(
		{
			...data,
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
		}, { merge: true });

	return data.id;
});

const deleteSubmission = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Submission, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await SubmissionService.canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkSubmissionExists(data.id!)) throw SubmissionDoesNotExistException;

	await db.collection('submissions').doc(data.id!).delete();
	return;
});

const sendReminder = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: Submission, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await SubmissionService.canEdit(context, data.id!)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkSubmissionExists(data.id!)) throw SubmissionDoesNotExistException;

	const submissionRef = await db.collection('submissions').doc(data.id!).get();
	if (!submissionRef.exists) throw SubmissionDoesNotExistException;

	const submission: Submission = submissionRef.data();

	if (await SubmissionService.canEdit(context, data.id!)) {
		if (!await SubmissionService.hasResponsesAccess(submission.responsesLink)) throw NoResponseAccessException;
		submission['responseList'] = await SubmissionService.getResponseList(submission);
	}

	const intendedSubmitters: String[] = submission.submitters;
	const responseList: String[] = submission.responseList!;
	const notSubmitted = intendedSubmitters.filter(x => !responseList.includes(x));

	await db.collection('notifications').doc(submission.id + "-" + logger.getSLTimestamp()).set(
		{
			bcc: notSubmitted,
			template: {
				name: "submission reminder",
				data: {
					submission_title: submission.title,
					submission_link: submission.submissionLink
				}
			}
		});

	return;
});

function makeUrlFriendly(value: string) {
	return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function checkSubmissionExists(id: string): Promise<boolean> {
	const docRef = await db.collection('submissions').doc(id);
	const docSnapshot = await docRef.get();
	return !!docSnapshot.exists;
}

module.exports = {
	createSubmission: createSubmission,
	getSubmission: getSubmission,
	editSubmission: editSubmission,
	deleteSubmission: deleteSubmission,
	sendReminder: sendReminder
}
