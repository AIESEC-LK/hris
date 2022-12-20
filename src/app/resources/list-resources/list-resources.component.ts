import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../../auth/auth.service";
import { MatDialog } from "@angular/material/dialog";
import { ErrorComponent } from "../../dialogs/error/error.component";
import { Resource, ResourcesService } from "../resources.service";
import { MatTableDataSource } from "@angular/material/table";
import { Member } from "../../member/member.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { LoadingComponent } from "../../dialogs/loading/loading.component";
import { Title } from "@angular/platform-browser";
import { MatPaginator } from '@angular/material/paginator';
import { ThrowStmt } from '@angular/compiler';


@Component({
	selector: 'app-list-resources',
	templateUrl: './list-resources.component.html',
	styleUrls: ['./list-resources.component.css']
})
export class ListResourcesComponent implements OnInit {

	resources?: Resource[];
	functions: string[] = [];

	loading = true;

	dataSource = new MatTableDataSource(this.resources);

	@ViewChild(MatPaginator, { static: false }) paginator!: MatPaginator;

	selectedColumns = ['title', 'functions', 'link', 'visits', 'open'];

	filter = {
		quick_filter: "",
		functions: this.functions,
	};

	constructor(private route: ActivatedRoute, public authService: AuthService,
		public resourceService: ResourcesService, private dialog: MatDialog,
		private _snackBar: MatSnackBar, private titleService: Title, private changeDetectorRef: ChangeDetectorRef) {
		this.titleService.setTitle(`Resources | ASL 360°`);
	}

	async ngOnInit(): Promise<void> {
		if (!await this.authService.isLoggedIn()) await this.authService.login();

		try {
			this.resources = await this.resourceService.getResources();
			this.functions = ResourcesService.getFunctions(this.resources);
			this.dataSource.data = this.resources;
			this.changeDetectorRef.detectChanges();
			this.dataSource.paginator = this.paginator;
			this.getDisplayedColumns();
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}

		this.loading = false;
	}

	getLink(resource: Resource) {
		return document.location.protocol + '//' + document.location.host + "/r/" + resource.id;
	}

	copyLink(resource: Resource) {
		navigator.clipboard.writeText(this.getLink(resource))
		this._snackBar.open("Link has been copied to your clipboard.", 'OK', {
			duration: 3000
		});
	}

	async delete(resource: Resource) {
		let loadingDialog = this.dialog.open(LoadingComponent);
		try {
			await this.resourceService.deleteResource(resource);
			this.resources = this.resources?.filter(item => item !== resource)
			this.dataSource = new MatTableDataSource<Resource>(this.resources);
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
			this.selectedColumns.splice(this.selectedColumns.length, 0, 'edit');
			this.selectedColumns.splice(this.selectedColumns.length, 0, 'delete');
		}

		if (window.innerWidth < 960) this.selectedColumns = ['title', 'open'];
	}


	public doFilter() {
		this.dataSource.data = this.resources!;
		this.dataSource.filter = this.filter.quick_filter.trim().toLocaleLowerCase();

		//Filter by function
		const filter_functions = this.filter.functions;
		if (filter_functions.length > 0) {
			this.dataSource.data = this.dataSource.data.filter(e => {
				return filter_functions.some(item => e.functions!.includes(item))
			});
		}
	}

	show() {
		// Required to access this.contentPlaceholder below,
		// otherwise contentPlaceholder will be undefined

		console.log(this.paginator);
	}

}
