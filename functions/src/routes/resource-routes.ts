export {}

import {CallableContext} from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
//const OpportunityService = require("../services/opportunity-service");
const logger = require("../middleware/logger");

export interface Resource {
  id: string,
  title: string,
  link: string,
  functions: string[],
  keywords: string[]
}

const ResourceAlreadyExistsException = new functions.https.HttpsError('already-exists', "Resource already exists.",
  {message: "A resource with this title already exists."})

const createResource = functions.https.onCall(async (data:Resource, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);
  if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

  const unique_id = makeUrlFriendly(data.title);
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
    }, {merge: true});

  return unique_id;
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
}
