import { CallableContext } from "firebase-functions/lib/common/providers/https";
import { Submission } from "../routes/submission-routes";
const admin = require('firebase-admin');
const db = admin.firestore();
const AuthService = require("../services/auth-service");
const { google } = require('googleapis');


async function canView(context: CallableContext, id: string): Promise<boolean> {
	return true;
}

async function canEdit(context: CallableContext, id: string): Promise<boolean> {
	const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

	// if current user is an admin, obviously can see all.
	if (currentUserRoles.includes("admin")) return true;

	// Current user must be EB or above and from the same entity.
	if (!currentUserRoles.includes("eb")) return false;
	const targetEntity = (await db.collection('submissions').doc(id).get()).data().entity;
	if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

	return false;
}

async function hasResponsesAccess(responsesLink: string): Promise<boolean> {
	const spreadsheetId = (responsesLink.split("spreadsheets/d/")[1]).split("/")[0];
	const sheets = google.sheets({ version: 'v4' });



	try {
		const result = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheetId,
			range: 'Form Responses 1!A1:B1',
			auth: getJwt(),
		});

		console.log(result.data.values[0][0], result.data.values[0][1]);
		return result.data.values[0][0] == "Timestamp" && result.data.values[0][1] == "Email Address";
	} catch (e) {
		return false;
	}
}

async function getResponseList(submission: Submission): Promise<String[] | Error> {
	const spreadsheetId = (submission.responsesLink.split("spreadsheets/d/")[1]).split("/")[0];
	const sheets = google.sheets({ version: 'v4' });

	try {
		const result = await sheets.spreadsheets.values.get({
			spreadsheetId: spreadsheetId,
			range: 'Form Responses 1!A:B',
			auth: getJwt(),
		});

		const emailList: string[] = [];
		for (let i = result.data.values.length - 1; i >= 1; i--) {
			if (emailList.includes(result.data.values[i][1])) continue;
			emailList.push(result.data.values[i][1]);
		}

		return emailList;
	} catch (e: any) {
		return e;
	}

}

function getJwt() {
	const credentials = require("../../src/aiesec-hris-firebase-adminsdk-jm89q-69ea10c068.json")
	return new google.auth.JWT(
		credentials.client_email, null, credentials.private_key,
		['https://www.googleapis.com/auth/spreadsheets']
	);
}



module.exports = {
	canView: canView,
	canEdit: canEdit,
	hasResponsesAccess: hasResponsesAccess,
	getResponseList: getResponseList
}
