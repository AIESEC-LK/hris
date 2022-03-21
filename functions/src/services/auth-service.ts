import {CallableContext} from "firebase-functions/lib/common/providers/https";
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = admin.auth();
const HttpsError = require('firebase-functions').https.HttpsError;


const NotLoggedInException = new HttpsError('unauthenticated', "Not logged in",
  {message: "You are not logged in."})
const NotAuthorizedException = new HttpsError('unauthenticated', "Not authorized",
  {message: "You are not authorized to access this page."})

async function canView(context: CallableContext, email: string): Promise<boolean> {
  await checkLoggedIn(context);
  return true;

  /*
  const currentUserRoles: string[] = await module.exports.getCurrentUserRoles(context);

  // if current user ia admin, obviously can see all.
  if (currentUserRoles.includes("admin")) return true;

  // If current user is EB, must be from the same entity.
  if (currentUserRoles.includes("eb")) {
    const targetEntity = (await db.collection('members').doc(email).get()).data().entity;
    if (await getCurrentUserEntity(context) == targetEntity) return true;
  }

  if (getCurrentUserEmail(context) == email) return true;

  return false;
   */
}

async function canEdit(context: CallableContext, email: string): Promise<boolean> {
  const currentUserRoles: string[] = await module.exports.getCurrentUserRoles(context);

  // if current user ia admin, obviously can see all.
  if (currentUserRoles.includes("admin")) return true;

  // If current user is EB, must be from the same entity.
  if (currentUserRoles.includes("eb")) {
    const targetEntity = (await db.collection('members').doc(email).get()).data().entity;
    if (await getCurrentUserEntity(context) == targetEntity) return true;
  }

  if (getCurrentUserEmail(context) == email) return true;

  return false;
}

async function canSuperEdit(context: CallableContext, email: string): Promise<boolean> {
  const currentUserRoles: string[] = await module.exports.getCurrentUserRoles(context);

  // if current user ia admin, obviously can see all.
  if (currentUserRoles.includes("admin")) return true;

  // If current user is EB, must be from the same entity.
  if (currentUserRoles.includes("eb")) {
    const targetEntity = (await db.collection('members').doc(email).get()).data().entity;
    if (await getCurrentUserEntity(context) == targetEntity) return true;
  }

  return false;
}

async function getCurrentUserRoles(context: CallableContext): Promise<string[]> {
  if (!context.auth) return [];
  const tokenResult = await auth.getUser(context.auth?.uid!);
  if (!(tokenResult.customClaims) || !tokenResult.customClaims["role"]) throw NotAuthorizedException;

  const roles = tokenResult.customClaims["role"];
  if (roles.constructor === Array) return roles;
  else return [roles];
}

async function checkLoggedIn(context: CallableContext): Promise<void> {
  const email = context.auth?.token.email;
  const uid = context.auth?.uid;
  if (uid == null) throw NotLoggedInException;
  if (email == null) throw NotAuthorizedException;
}

function getCurrentUserEmail(context: CallableContext): String {
  const email = context.auth?.token.email;
  if (email) return email;
  throw NotLoggedInException;
}

async function getCurrentUserEntity(context: CallableContext): Promise<String> {
  return (await db.collection('users').doc(await getCurrentUserEmail(context)).get()).data().entity;
}

async function checkPrivileged(context: CallableContext) {
  if (!(await getCurrentUserRoles(context)).includes("admin") &&
    !(await getCurrentUserRoles(context)).includes("eb"))
    return false;
  return true;
}

async function isAdmin(context: CallableContext) {
  return (await getCurrentUserRoles(context)).includes("admin")
}

async function isEBOrAbove(context: CallableContext) {
  return (await getCurrentUserRoles(context)).includes("eb") || isAdmin(context);
}


async function getEntity(context: CallableContext) {
  return (await db.collection('users').doc(context.auth?.token.email!).get()).data().entity;
}

function getEmail(context: CallableContext): string {
  return context.auth?.token.email!;
}

module.exports = {
  canView: canView,
  canEdit: canEdit,
  canSuperEdit: canSuperEdit,
  getCurrentUserRoles: getCurrentUserRoles,
  getCurrentUserEntity: getCurrentUserEntity,
  checkPrivileged: checkPrivileged,
  checkLoggedIn: checkLoggedIn,
  isAdmin: isAdmin,
  isEBOrAbove: isEBOrAbove,
  getEntity: getEntity,
  getEmail: getEmail,
  exceptions : {
    NotLoggedInException: NotLoggedInException,
    NotAuthorizedException: NotAuthorizedException
  }
}
