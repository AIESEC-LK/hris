import {EventContext} from "firebase-functions";

export {}

const functions = require('firebase-functions');
const firestore = require('@google-cloud/firestore');
const client = new firestore.v1.FirestoreAdminClient();

// Replace BUCKET_NAME
const bucket = 'gs://hris-firestore-exports';

exports.scheduledFirestoreExport = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context:EventContext) => {
    await backup();
  });

exports.backup = functions.https.onRequest(async (req:Request, res:Response) => {
  await backup();
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
