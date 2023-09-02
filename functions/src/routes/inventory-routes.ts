export { }

import { CallableContext } from "firebase-functions/lib/common/providers/https";
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const db = admin.firestore();

const AuthService = require("../services/auth-service");
const logger = require("../middleware/logger");

export interface InventoryItem {
	id: string,
	name: string,
	notes: string,
	entity: string,
	activeRequests: InventoryRequest[]
}

export interface InventoryRequest {
	id: string,
	inventoryItemId: string,
	pickUp: string,
	return: string,
	reason: string,
	status: string,
	entity: string,
	created_by: string
}

const InventoryItemAlreadyExistsException = new functions.https.HttpsError('already-exists', "Inventory item already exists.",
	{ message: "An inventory item with this title already exists." })
const InventoryItemDoesNotExistException = new functions.https.HttpsError('not-found', "Inventory item does not exist.",
	{ message: "This inventory item does not exist." })
const InventoryRequestDoesNotExistException = new functions.https.HttpsError('not-found', "Inventory request does not exist.",
	{ message: "This inventory request does not exist." })



const createInventoryItem = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryItem, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await AuthService.checkPrivileged(context)) throw AuthService.exceptions.NotAuthorizedException

	if (await checkInventoryItemExists(data.id)) throw InventoryItemAlreadyExistsException;

	await db.collection('inventory').doc(data.id).set(
		{
			...data,
			entity: await AuthService.getEntity(context),
			created_by: await AuthService.getEmail(context),
			created_at: logger.getSLTimestamp(),
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
		}, { merge: true });

	return data.id;
});

const getInventoryItems = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	await AuthService.checkLoggedIn(context);

	let inventoryItems;
	if (await AuthService.isAdmin(context)) inventoryItems = await db.collection('inventory');
	else inventoryItems = await db.collection('inventory')
		.where("entity", "in", [await AuthService.getEntity(context), "Sri Lanka"])
		.orderBy("last_modified_at", "desc");

	let inventoryItemMap = new Map<string, InventoryItem>();
	const inventoryItemIds: string[] = [];
	const querySnapshot = await inventoryItems.get()
	querySnapshot.forEach((doc: any) => {
		inventoryItemMap.set(doc.id, {
			...doc.data(),
			activeRequests: []
		});
		inventoryItemIds.push(doc.id);
	});

	const inventoryRequestsSnapshot = await db.collection('inventory-requests')
		.where("status", "==", "approved")
		.where("inventoryItemId", "in", inventoryItemIds)
		.where("return", ">=", logger.getSLTimestamp().replace(" ", "T"))
		.get();
	inventoryRequestsSnapshot.forEach((doc: any) => {
		const inventoryItemRequest = doc.data();
		if (inventoryItemMap.has(inventoryItemRequest.inventoryItemId)) {
			inventoryItemMap.get(inventoryItemRequest.inventoryItemId)!.activeRequests.push(inventoryItemRequest);
		}
	});

	let items: InventoryItem[] = [];
	for (const inventoryItem of inventoryItemMap.values()) {
		items.push(inventoryItem);
	}

	return items;
});

const getInventoryItem = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canView(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	const id = data.id;
	return getInventoryItemInner(id);
});

const editInventoryItem = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryItem, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkInventoryItemExists(data.id)) throw InventoryItemDoesNotExistException;

	await db.collection('inventory').doc(data.id).set(
		{
			...data,
			last_modified_by: await AuthService.getEmail(context),
			last_modified_at: logger.getSLTimestamp(),
		}, { merge: true });

	return data.id;
});

const deleteInventoryItem = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryItem, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canEdit(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkInventoryItemExists(data.id)) throw InventoryItemDoesNotExistException;

	await db.collection('inventory').doc(data.id).delete();
	return;
});

const createRequest = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canView(context, data.inventoryItemId)) throw AuthService.exceptions.NotAuthorizedException

	const requestId = logger.getSLTimestamp() + "_$_" + data.inventoryItemId + "_$_" + await AuthService.getEmail(context);
	await db.collection('inventory-requests').doc(requestId).set(
		{
			id: requestId,
			inventoryItemId: data.inventoryItemId,
			pickUp: data.pickUp,
			return: data.return,
			reason: data.reason,
			entity: await AuthService.getEntity(context),
			status: "pending",
			created_by: await AuthService.getEmail(context),
			created_at: logger.getSLTimestamp(),
		}, { merge: true });


	const inventoryItem = await getInventoryItemInner(data.inventoryItemId);
	db.collection('notifications').doc("inventory-request" + "-" + requestId + "-" + logger.getSLTimestamp()).set(
		{
			to: await getInventoryManager(inventoryItem.entity),
			replyTo: data.created_by,
			from: "ASL360 Inventory <inventory@360.aiesec.lk>",
			template: {
				name: "inventory request create",
				data: {
					inventoryItemId: data.inventoryItemId,
					pickUp: data.pickUp,
					return: data.return,
					reason: data.reason,
					entity: await AuthService.getEntity(context),
					created_by: await AuthService.getEmail(context),
				}
			}
		});

	return requestId;
});

const deleteRequest = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canEditRequest(context, data.id)) throw AuthService.exceptions.NotAuthorizedException

	if (!await checkRequestExists(data.id)) throw InventoryRequestDoesNotExistException;

	await db.collection('inventory-requests').doc(data.id).delete();
	return;
});

const getActiveRequests = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: any, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	await AuthService.checkPrivileged(context);

	let inventoryRequests;
	if (await AuthService.isAdmin(context)) inventoryRequests = await db.collection('inventory-requests');
	else {
		const inventoryItemIds: string[] = [];
		const inventoryItems: InventoryItem[] = await getInventoryItemsInner(context);
		for (const inventoryItem of inventoryItems) {
			inventoryItemIds.push(inventoryItem.id);
		}
		inventoryRequests = await db.collection('inventory-requests')
			.where("inventoryItemId", "in", inventoryItemIds);
	}

	inventoryRequests = inventoryRequests.orderBy("return", "asc").where("return", ">=", logger.getSLTimestamp().replace(" ", "T"));

	const querySnapshot = await inventoryRequests.get();

	const activeRequests: InventoryRequest[] = [];
	querySnapshot.forEach((doc: any) => {
		activeRequests.push(doc.data());
	});

	return activeRequests;
});

const approveRequest = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canEditRequest(context, data.id)) throw AuthService.exceptions.NotAuthorizedException
	if (!await checkRequestExists(data.id)) throw InventoryRequestDoesNotExistException;

	await db.collection('inventory-requests').doc(data.id).set(
		{
			status: "approved",
			approved_by: await AuthService.getEmail(context),
			approved_at: logger.getSLTimestamp(),
		}, { merge: true });

	const inventoryItem = await getInventoryItemInner(data.inventoryItemId);
	db.collection('notifications').doc("inventory-request-approve" + "-" + data.id + "-" + logger.getSLTimestamp()).set(
		{
			to: data.created_by,
			from: "ASL360 Inventory <inventory@360.aiesec.lk>",
			replyTo: await getInventoryManager(inventoryItem.entity),
			template: {
				name: "inventory request approve",
				data: {
					inventoryItemName: inventoryItem.name,
					inventoryItemId: data.inventoryItemId,
					pickUp: data.pickUp,
					return: data.return,
					reason: data.reason,
				}
			}
		});

	return data.id;
});

const rejectRequest = functions.runWith({
	timeoutSeconds: 30,
	memory: "8GB",
}).https.onCall(async (data: InventoryRequest, context: CallableContext) => {
	logger.logFunctionInvocation(context, data);
	if (!await canEditRequest(context, data.id)) throw AuthService.exceptions.NotAuthorizedException
	if (!await checkRequestExists(data.id)) throw InventoryRequestDoesNotExistException;

	await db.collection('inventory-requests').doc(data.id).set(
		{
			status: "rejected",
			approved_by: await AuthService.getEmail(context),
			approved_at: logger.getSLTimestamp(),
		}, { merge: true });

	const inventoryItem = await getInventoryItemInner(data.inventoryItemId);
	db.collection('notifications').doc("inventory-request-reject" + "-" + data.id + "-" + logger.getSLTimestamp()).set(
		{
			to: data.created_by,
			from: "ASL360 Inventory <inventory@360.aiesec.lk>",
			replyTo: await getInventoryManager(inventoryItem.entity),
			template: {
				name: "inventory request reject",
				data: {
					inventoryItemName: inventoryItem.name,
					inventoryItemId: data.inventoryItemId,
					pickUp: data.pickUp,
					return: data.return,
					reason: data.reason,
				}
			}
		});

	return data.id;
});

async function getInventoryItemInner(id: string) {
	const opportunityRef = await db.collection('inventory').doc(id).get();
	if (!opportunityRef.exists) throw InventoryItemDoesNotExistException;

	const inventoryItem: InventoryItem = opportunityRef.data();
	return inventoryItem
}

async function checkInventoryItemExists(id: string) {
	const doc = await db.collection('inventory').doc(id).get();
	return doc.exists;
}

async function checkRequestExists(id: string) {
	const doc = await db.collection('inventory-requests').doc(id).get();
	return doc.exists;
}


async function canEdit(context: CallableContext, id: string): Promise<boolean> {
	const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

	// if current user is an admin, obviously can see all.
	if (currentUserRoles.includes("admin")) return true;

	// Current user must be EB or above and from the same entity.
	if (!currentUserRoles.includes("eb")) return false;
	const targetEntity = (await db.collection('inventory').doc(id).get()).data().entity;
	if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

	return false;
}

async function canEditRequest(context: CallableContext, id: string): Promise<boolean> {
	const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

	// if current user is an admin, obviously can see all.
	if (currentUserRoles.includes("admin")) return true;

	// Current user must be EB or above and from the same entity.
	if (!currentUserRoles.includes("eb")) return false;
	const targetEntity = (await db.collection('inventory-requests').doc(id).get()).data().entity;
	if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

	return false;
}

async function canView(context: CallableContext, id: string): Promise<boolean> {
	// Temporarily everyone can see resources.
	return true;

	const currentUserRoles: string[] = await AuthService.getCurrentUserRoles(context);

	// if current user is an admin, obviously can see all.
	if (currentUserRoles.includes("admin")) return true;

	// Current user must be from the same entity.
	const targetEntity = (await db.collection('resources').doc(id).get()).data().entity;
	const openEntities = ["Sri Lanka", "Asia Pacific", "International"];
	if (openEntities.includes(targetEntity)) return true;
	if (await AuthService.getCurrentUserEntity(context) == targetEntity) return true;

	return false;
}

async function getInventoryItemsInner(context: CallableContext): Promise<InventoryItem[]> {
	let inventoryItems;
	if (await AuthService.isAdmin(context)) inventoryItems = await db.collection('inventory');
	else inventoryItems = await db.collection('inventory')
		.where("entity", "in", [await AuthService.getEntity(context), "Sri Lanka"])
		.orderBy("last_modified_at", "desc");

	let inventoryItemMap = new Map<string, InventoryItem>();
	const querySnapshot = await inventoryItems.get()
	querySnapshot.forEach((doc: any) => {
		inventoryItemMap.set(doc.id, {
			...doc.data(),
			activeRequests: []
		});
	});

	let items: InventoryItem[] = [];
	for (const inventoryItem of inventoryItemMap.values()) {
		items.push(inventoryItem);
	}

	return items;
}

async function getInventoryManager(entity: string): Promise<string> {
	return (await db.collection('config').doc('inventory-managers').get()).data()[entity];
}

module.exports = {
	createInventoryItem: createInventoryItem,
	getInventoryItems: getInventoryItems,
	deleteInventoryItem: deleteInventoryItem,
	getInventoryItem: getInventoryItem,
	editInventoryItem: editInventoryItem,
	createRequest: createRequest,
	getActiveRequests: getActiveRequests,
	deleteRequest: deleteRequest,
	approveRequest: approveRequest,
	rejectRequest: rejectRequest
}
