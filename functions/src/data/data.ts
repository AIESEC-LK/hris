import { EventContext } from "firebase-functions";

export { }

const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();
const admin = require('firebase-admin');
const db = admin.firestore();
const member = require("../routes/member-routes");

// Replace BUCKET_NAME
const bucket = 'gs://hris-firestore-exports';

exports.scheduledFirestoreExport = functions.pubsub
	.schedule('every 24 hours')
	.onRun(async (context: EventContext) => {
		await backup();
	});

exports.backup = functions.https.onRequest(async (req: Request, res: Response) => {
	await backup();
});

exports.refeshMembershipInfoManual = functions.runWith({
	timeoutSeconds: 540,
	memory: "8GB",
}).https.onRequest(async (req: any, res: any) => {
	if (req.query.expa_id) {
		let expa_data;
		const members = await db.collection("members").where("expa_id", "==", req.query.expa_id.toString());
		const querySnapshot = await members.get()
		const querySnapshots: any[] = [];

		//@ts-ignore
		querySnapshot.forEach(doc => {
			querySnapshots.push(doc)
		});
		for (const doc of querySnapshots) {
			expa_data = await member.getMemberExpaInfo(doc.id, req.query.expa_id);
		}
		res.send(expa_data);
	} else {
		let fetchCount: number = 2;
		if (req.query.fetchCount) fetchCount = parseInt(req.query.fetchCount);
		const fetched: string[] = await updateMemberDetails(fetchCount);
		res.send(fetched);
	}
});

exports.refeshMembershipInfo = functions.pubsub
	.schedule('every hour')
	.onRun(async (context: EventContext) => {
		await updateMemberDetails(10);
	});


async function backup() {
	const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
	const databaseName = client.databasePath(projectId, '(default)');

	return await client.exportDocuments({
		name: databaseName,
		outputUriPrefix: bucket,
		// Leave collectionIds empty to export all collections
		// or set to a list of collection IDs to export,
		// collectionIds: ['users', 'posts']
		collectionIds: []
	})
}

async function updateMemberDetails(fetchCount: number): Promise<string[]> {
	let count = 0;
	const fetched: string[] = []
	let lastIndex = (await db.collection('config').doc('cron').get()).data().memberRefreshIndex;
	const members = await db.collection("members")
		.where("expa_id", "!=", "")
		.orderBy("expa_id")
		.startAfter(lastIndex)
		.limit(fetchCount);

	const querySnapshot = await members.get()
	const querySnapshots: any[] = [];

	//@ts-ignore
	querySnapshot.forEach(doc => {
		querySnapshots.push(doc)
	});
	for (const doc of querySnapshots) {
		await member.getMemberExpaInfo(doc.id, doc.data().expa_id);
		count = count + 1;
		lastIndex = doc.data().expa_id;
		fetched.push(doc.data().expa_id);
	}
	if (count == fetchCount) await db.collection('config').doc("cron").set({ memberRefreshIndex: lastIndex }, { merge: true });
	else await db.collection('config').doc("cron").set({ memberRefreshIndex: "0" }, { merge: true });
	return fetched;
}
