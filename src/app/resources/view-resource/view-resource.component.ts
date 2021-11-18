import { Component, OnInit } from '@angular/core';
import {ErrorComponent} from "../../dialogs/error/error.component";
import {Resource, ResourcesService} from "../resources.service";
import {Opportunity} from "../../opportunity/opportunity.service";
import {MatDialog} from "@angular/material/dialog";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-view-resource',
  templateUrl: './view-resource.component.html',
  styleUrls: ['./view-resource.component.css']
})
export class ViewResourceComponent implements OnInit {

  resource?: Resource;
  loading = true;


  constructor(private resourcesService: ResourcesService, private dialog: MatDialog, private route:ActivatedRoute) { }

  async ngOnInit(): Promise<void> {
    // Temporarily disable login check to allow non-added users
    // if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      const id = <string>this.route.snapshot.paramMap.get("id");
      this.resource = await this.resourcesService.getResource(id);
      window.location.replace(this.resource!.link);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
  }

}
