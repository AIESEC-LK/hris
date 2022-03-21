export {}

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const redirect = functions.https.onRequest(async (req: any, res: any) => {
  const resource = req.query.resource;
  const url = (await db.collection('resources').doc(resource).get()).data().link;
  res.redirect(url); 
});

module.exports = {
  redirect: redirect
}
