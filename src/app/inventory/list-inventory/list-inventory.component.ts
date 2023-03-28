import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ErrorComponent } from 'src/app/dialogs/error/error.component';
import { LoadingComponent } from 'src/app/dialogs/loading/loading.component';
import { StringInputDialogComponent } from 'src/app/dialogs/string-input-dialog/string-input-dialog.component';
import { ResourcesService } from 'src/app/resources/resources.service';
import { InventoryItem, InventoryRequest, InventoryService } from '../inventory-service';

@Component({
	selector: 'app-list-inventory',
	templateUrl: './list-inventory.component.html',
	styleUrls: ['./list-inventory.component.css']
})
export class ListInventoryComponent implements OnInit {

	inventoryItems?: InventoryItem[];
	activeRequests?: InventoryRequest[];
	ownedInventory?: string[];

	loading = true;
	requestsLoading = false;

	dataSource = new MatTableDataSource(this.inventoryItems);
	requestsDataSource = new MatTableDataSource(this.activeRequests);


	@ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

	selectedColumns = ['id', 'name', 'book'];
	requestsSelectedColumns = ["item", "entity", "pickUp", "return", "info", "status", "options", "actions"];

	filter = {
		quick_filter: "",
		pickUp: "",
		return: ""
	};

	requestsFilter = {
		quick_filter: ""
	}

	reason: string;


	constructor(private route: ActivatedRoute, public authService: AuthService,
		public inventoryService: InventoryService, private dialog: MatDialog, private titleService: Title, private changeDetectorRef: ChangeDetectorRef) {
		this.titleService.setTitle(`Inventory | ASL 360°`);
	}

	async ngOnInit(): Promise<void> {
		if (!this.authService.isLoggedIn()) await this.authService.login();

		try {
			this.inventoryItems = await this.inventoryService.getInventoryItems();
			this.dataSource.data = this.inventoryItems!;
			this.changeDetectorRef.detectChanges();
			this.dataSource.paginator = this.paginator;
			this.getDisplayedColumns();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}

		this.loading = false;
		this.ownedInventory = [];
		for (const item of this.inventoryItems!) {
			if (item.entity == this.authService.getEntity()) this.ownedInventory.push(item.id);
		}

		if (this.authService.isEBOrAbove()) {
			this.requestsLoading = true;
			this.activeRequests = await this.inventoryService.getActiveRequests();
			this.requestsDataSource.data = this.activeRequests;
			this.requestsLoading = false;
		}
	}

	async delete(inventoryItem: InventoryItem) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.inventoryService.deleteInventoryItem(inventoryItem);
			this.inventoryItems = this.inventoryItems?.filter(item => item !== inventoryItem)
			this.dataSource = new MatTableDataSource<InventoryItem>(this.inventoryItems);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	async deleteRequest(request: InventoryRequest) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.inventoryService.deleteRequest(request);
			this.activeRequests = this.activeRequests?.filter(item => item !== request)
			this.requestsDataSource = new MatTableDataSource<InventoryRequest>(this.activeRequests);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	getDisplayedColumns(): void {
		if (this.authService.isAdmin()) this.selectedColumns.splice(this.selectedColumns.length - 1, 0, 'entity');
		if (this.authService.isEBOrAbove()) {
			this.selectedColumns.splice(this.selectedColumns.length, 0, 'actions');
		}

		if (window.innerWidth < 960) this.selectedColumns = ['id', 'name'];
	}

	public doFilter() {
		this.dataSource.data = this.inventoryItems!;
		this.dataSource.filter = this.filter.quick_filter.trim().toLocaleLowerCase();

		// // filter by pick up date
		// if (this.filter.pickUp != "") {
		// 	console.log(this.filter.pickUp);
		// 	this.dataSource.data = this.dataSource.data.filter((item: InventoryItem) => {
		// 		for (const request of item.activeRequests) {
		// 			if (this.filter.pickUp < request.return) return true;
		// 		}
		// 		return false;
		// 	});
		// }

		// // filter by return date
		// if (this.filter.return != "") {
		// 	this.dataSource.data = this.dataSource.data.filter((item: InventoryItem) => {
		// 		for (const request of item.activeRequests) {
		// 			if (this.filter.return > request.pickUp) return true;
		// 		}
		// 		return false;
		// 	});
		// }
	}

	public doFilterRequests() {
		this.requestsDataSource.data = this.activeRequests!;
		this.requestsDataSource.filter = this.requestsFilter.quick_filter.trim().toLocaleLowerCase();
	}

	public getInfo(inventoryItem: InventoryItem): string {
		return inventoryItem.notes;
	}

	public request(inventoryItem: InventoryItem) {
		const dialogRef = this.dialog.open(StringInputDialogComponent, {
			data: {
				message: "What do you need " + inventoryItem.name + " for ?",
				confirm_text: "REQ",
				value: this.reason
			}
		});

		dialogRef.afterClosed().subscribe(async result => {
			if (result == null) return;
			this.reason = result;
			await this.inventoryService.createRequest(inventoryItem, this.filter.pickUp, this.filter.return, this.reason);
			this.activeRequests = await this.inventoryService.getActiveRequests();
			this.doFilterRequests();
		});
	}

	public validDateRange(inventoryItem: InventoryItem): boolean {
		if (this.filter.pickUp == "" || this.filter.return == "") return false;
		if (this.filter.pickUp > this.filter.return) return false;

		for (const request of inventoryItem.activeRequests) {
			if (this.filter.pickUp < request.return && this.filter.return > request.pickUp) return false;
		}
		return true;
	}

	public getDayOfWeek(datetime: string): string {
		var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		const d = new Date(datetime);
		let day = d.getDay();
		return days[day];
	}

	public getDuration(pickUp: string, _return: string): string {
		const pickUpDate = new Date(pickUp).getTime();
		const returnDate = new Date(_return).getTime();

		// get total seconds between the times
		var delta = Math.abs(returnDate - pickUpDate) / 1000;

		// calculate (and subtract) whole days
		var days = Math.floor(delta / 86400);
		delta -= days * 86400;

		// calculate (and subtract) whole hours
		var hours = Math.floor(delta / 3600) % 24;
		delta -= hours * 3600;

		// calculate (and subtract) whole minutes
		var minutes = Math.floor(delta / 60) % 60;
		delta -= minutes * 60;

		// what's left is seconds
		var seconds = delta % 60;  // in theory the modulus is not required

		let returnStr = "";
		if (seconds > 0) returnStr = ", " + seconds + " seconds";
		if (minutes > 0 || returnStr != "") returnStr = ", " + minutes + " minutes " + returnStr;
		if (hours > 0 || returnStr != "") returnStr = ", " + hours + " hours " + returnStr;
		if (days > 0 || returnStr != "") returnStr = days + " days" + returnStr;

		return returnStr;
	}

	public canEdit(inventoryItemId: string): boolean {
		if (!this.ownedInventory) return false;
		return this.ownedInventory?.indexOf(inventoryItemId) > -1;
	}

	public async markAsApproved(request: InventoryRequest) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.inventoryService.approveRequest(request);
			request.status = "approved";
			this.requestsDataSource = new MatTableDataSource<InventoryRequest>(this.activeRequests);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

	public async markAsRejected(request: InventoryRequest) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.inventoryService.rejectRequest(request);
			request.status = "rejected";
			this.requestsDataSource = new MatTableDataSource<InventoryRequest>(this.activeRequests);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

}
