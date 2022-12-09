export {}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();
const {BigQuery} = require('@google-cloud/bigquery');
const logger = require("../middleware/logger");

const redirect = functions.runWith({
  timeoutSeconds: 30,
  memory: "8GB",
}).https.onRequest(async (req: any, res: any) => {
  const resource = req.query.resource;
  const url = (await db.collection('resources').doc(resource).get()).data().link;
  res.redirect(url); 

  const options = {
    keyFilename: 'bq-service-account.json',
    projectId: 'aiesec-hris',
  };
  const bigquery = new BigQuery(options);

  let rows = [{
    event_date: logger.getCurrentDate(),
    event_timestamp: logger.getSLTimestamp(),
    name: "resource.view",
    id: resource
  }];
  bigquery
    .dataset("analytics_285407858")
    .table("resource_events")
    .insert(rows);
});

module.exports = {
  redirect: redirect
}
