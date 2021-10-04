import {CallableContext} from "firebase-functions/lib/common/providers/https";
const admin = require('firebase-admin');
const db = admin.firestore();
const AuthService = require("../services/auth-service");


async function canView(context: CallableContext, id: string): Promise<boolean> {
  const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

  // if current user is an admin, obviously can see all.
  if (currentUserRoles.includes("admin")) return true;

  // Current user must be from the same entity.
  const targetEntity = (await db.collection('opportunities').doc(id).get()).data().entity;
  if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

  return false;
}

module.exports = {
  canView: canView,
}
