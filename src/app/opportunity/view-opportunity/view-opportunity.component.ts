import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {Opportunity, OpportunityService} from "../opportunity.service";

@Component({
  selector: 'app-view-opportunity',
  templateUrl: './view-opportunity.component.html',
  styleUrls: ['./view-opportunity.component.css']
})
export class ViewOpportunityComponent implements OnInit {

  opportunity?: Opportunity;
  loading = true;

  constructor(private route: ActivatedRoute, public authService:AuthService,
              public opportunityService: OpportunityService, private dialog: MatDialog) {
  }

  async ngOnInit(): Promise<void> {
    // Temporarily disable login check to allow non-added users
    // if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      const id = <string>this.route.snapshot.paramMap.get("id");
      this.opportunity = await this.opportunityService.getOpportunity(id);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
  }

}
