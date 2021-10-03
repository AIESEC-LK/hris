export {}

import {CallableContext} from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");
const validator = require('validator');

export interface Opportunity {
  title: string,
  photo: string,
  description: string,
  link: string,
  deadline: string
}

const OpportunityExistsException = new functions.https.HttpsError('already-exists', "Opportunity already exists.",
  {message: "An opportunity with this title already exists."})

const createOpportunity = functions.https.onCall(async (data:Opportunity, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);
  if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

  const unique_id = makeUrlFriendly(data.title);
  if (await checkOpportunityExists(unique_id)) throw OpportunityExistsException;
  data.description = validator.escape(data.description);

  await db.collection('opportunities').doc(unique_id).set(
    {
      entity: await AuthService.getEntity(context),
      created_by: await AuthService.getEmail(context),
      created_at: logger.getSLTimestamp(),
      last_modified_by: await AuthService.getEmail(context),
      last_modified_at: logger.getSLTimestamp(),
      ...data
    }, {merge: true});

  return unique_id;
});

function makeUrlFriendly(value: string) {
  return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function checkOpportunityExists(id: string): Promise<boolean> {
  const docRef = await db.collection('opportunities').doc(id);
  const docSnapshot = await docRef.get();
  return !!docSnapshot.exists;
}

module.exports = {
  createOpportunity: createOpportunity,
}
