import { Injectable } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MatDialog } from '@angular/material/dialog';
import { ErrorComponent } from '../dialogs/error/error.component';
import { LoadingComponent } from '../dialogs/loading/loading.component';

export interface InventoryItem {
	id: string,
	name: string,
	notes: string,
	entity: string,
	activeRequests: InventoryRequest[];
}

export interface InventoryRequest {
	id: string,
	inventoryItemId: string,
	pickUp: string,
	return: string,
	reason: string,
	status: string,
	entity: string,
	created_by: string,
	created_at: string,
}

@Injectable({
	providedIn: 'root'
})
export class InventoryService {

	constructor(private functions: AngularFireFunctions, private dialog: MatDialog) { }

	public async createInventoryItem(data: InventoryItem) {
		const createInventoryItem = this.functions.httpsCallable('inventory-createInventoryItem');
		return await createInventoryItem(data).toPromise();
	}

	public async getInventoryItems() {
		const getInventoryItems = this.functions.httpsCallable('inventory-getInventoryItems');
		return await getInventoryItems({}).toPromise();
	}

	public async getInventoryItem(id: string) {
		const getInventoryItem = this.functions.httpsCallable('inventory-getInventoryItem');
		return await getInventoryItem({ id: id }).toPromise();
	}

	public async editInventoryItem(data: InventoryItem, id: string) {
		const editInventoryItem = this.functions.httpsCallable('inventory-editInventoryItem');
		return await editInventoryItem(data).toPromise();
	}

	public async deleteInventoryItem(data: InventoryItem) {
		const deleteInventoryItem = this.functions.httpsCallable('inventory-deleteInventoryItem');
		return await deleteInventoryItem(data).toPromise();
	}

	public async createRequest(inventoryItem: InventoryItem, pickUp: string, _return: string, reason: string) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			const createRequest = this.functions.httpsCallable('inventory-createRequest');
			return await createRequest({
				inventoryItemId: inventoryItem.id,
				pickUp: pickUp,
				return: _return,
				reason: reason
			}).toPromise();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	public async getActiveRequests(): Promise<InventoryRequest[]> {
		const getActiveRequests = this.functions.httpsCallable('inventory-getActiveRequests');
		let requests: InventoryRequest[] = await getActiveRequests({}).toPromise();

		// sort requests by pickup date
		requests.sort((a, b) => (a.pickUp > b.pickUp) ? 1 : ((b.pickUp > a.pickUp) ? -1 : 0))
		return requests;
	}

	public async deleteRequest(request: InventoryRequest) {
		const deleteRequest = this.functions.httpsCallable('inventory-deleteRequest');
		return await deleteRequest(request).toPromise();
	}

	public async approveRequest(request: InventoryRequest) {
		const approveRequest = this.functions.httpsCallable('inventory-approveRequest');
		return await approveRequest(request).toPromise();
	}

	public async rejectRequest(request: InventoryRequest) {
		const rejectRequest = this.functions.httpsCallable('inventory-rejectRequest');
		return await rejectRequest(request).toPromise();
	}
}
