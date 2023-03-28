import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { ErrorComponent } from 'src/app/dialogs/error/error.component';
import { LoadingComponent } from 'src/app/dialogs/loading/loading.component';
import { InventoryItem, InventoryService } from '../inventory-service';

@Component({
	selector: 'app-create-inventory',
	templateUrl: './create-inventory.component.html',
	styleUrls: ['./create-inventory.component.css']
})
export class CreateInventoryComponent implements OnInit {

	form = new FormGroup({
		id: new FormControl(null, [Validators.required]),
		name: new FormControl(null, [Validators.required]),
		notes: new FormControl(null, [Validators.required])
	});

	edit = false;
	edit_id?: string;

	constructor(private route: ActivatedRoute, private titleService: Title, private dialog: MatDialog, private router: Router, private inventoryService: InventoryService, private authService: AuthService) {
		this.titleService.setTitle(`Create Inventory | ASL 360°`);
		if (this.route.snapshot.paramMap.get("id")) {
			this.titleService.setTitle(`Edit Inventory | ASL 360°`);
			this.edit = true;
		}
	}

	async ngOnInit(): Promise<void> {
		if (!await this.authService.isLoggedIn()) await this.authService.login();


		if (this.edit) {
			try {
				this.edit_id = <string>this.route.snapshot.paramMap.get("id");
				const inventoryItem: InventoryItem = await this.inventoryService.getInventoryItem(this.edit_id);
				this.form.setValue({
					id: inventoryItem.id,
					name: inventoryItem.name,
					notes: inventoryItem.notes
				})
			} catch (e) {
				this.dialog.open(ErrorComponent, { data: e });
			}
		}
	}

	async submitForm() {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			if (!this.form.valid) throw "There was an error with your form";

			if (this.edit) await this.inventoryService.editInventoryItem(this.form.value, this.edit_id!);
			else await this.inventoryService.createInventoryItem(this.form.value);

			await this.router.navigate(["/inventory/"]);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			loadingDialog.close();
		}
		return;
	}

}
