export {}

import {CallableContext} from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const OpportunityService = require("../services/opportunity-service");
const logger = require("../middleware/logger");

export interface Opportunity {
  id: string,
  title: string,
  photo: string,
  description: string,
  link: string,
  deadline: string
}

const OpportunityAlreadyExistsException = new functions.https.HttpsError('already-exists', "Opportunity already exists.",
  {message: "An opportunity with this title already exists."})
const OpportunityDoesNotExistException = new functions.https.HttpsError('not-found', "Opportunity does not exist.",
  {message: "This opportunity does not exist."})


const createOpportunity = functions.https.onCall(async (data:Opportunity, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);
  if(!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

  const unique_id = makeUrlFriendly(data.title);
  if (await checkOpportunityExists(unique_id)) throw OpportunityAlreadyExistsException;

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

const getOpportunity = functions.https.onCall(async (data:any, context:CallableContext) => {
  logger.logFunctionInvocation(context, data);
  if(!await OpportunityService.canView(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

  const id = data.id;

  const opportunityRef = await db.collection('opportunities').doc(id).get();
  if (!opportunityRef.exists) throw OpportunityDoesNotExistException;

  const opportunity:Opportunity = opportunityRef.data();

  return {
    id: id,
    title: opportunity.title,
    photo: opportunity.photo ?
      await admin.storage().bucket("aiesec-hris.appspot.com").file(opportunity.photo).getSignedUrl(
        { action: 'read', expires: "01-01-2500" }
      ) :
      "https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png",
    description: opportunity.description,
    deadline: opportunity.deadline,
    link: opportunity.link
  };
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
  getOpportunity: getOpportunity
}
