import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {Resource, ResourcesService} from "../resources.service";
import {MatTableDataSource} from "@angular/material/table";
import {Member} from "../../member/member.service";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-list-opportunities',
  templateUrl: './list-resources.component.html',
  styleUrls: ['./list-resources.component.css']
})
export class ListResourcesComponent implements OnInit {

  resources? : Resource[];
  loading = true;

  dataSource = new MatTableDataSource(this.resources);

  selectedColumns = ['title', 'functions', 'link', 'open'];


  constructor(private route: ActivatedRoute, public authService:AuthService,
              public resourceService: ResourcesService, private dialog: MatDialog,
              private _snackBar: MatSnackBar) {
  }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      this.resources = await this.resourceService.getResources();
      this.dataSource = new MatTableDataSource<Resource>(this.resources);
      this.getDisplayedColumns();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
  }

  getLink(resource: Resource) {
    return document.location.protocol +'//'+ document.location.host + "/r/" + resource.id;
  }

  copyLink(resource: Resource) {
    navigator.clipboard.writeText(this.getLink(resource))
    this._snackBar.open("Link has been copied to your clipboard.", 'OK', {
      duration: 3000
    });
  }

  getDisplayedColumns(): void {
    if (this.authService.isAdmin()) this.selectedColumns.splice(this.selectedColumns.length-1, 0, 'entity');
    if (this.authService.isEBOrAbove()) {
      this.selectedColumns.splice(this.selectedColumns.length, 0, 'edit');
      this.selectedColumns.splice(this.selectedColumns.length, 0, 'delete');
    }

    if (window.innerWidth < 960) this.selectedColumns = ['title', 'open'];
  }

}
