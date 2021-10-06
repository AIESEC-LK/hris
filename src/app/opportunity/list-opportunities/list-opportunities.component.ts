import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {Opportunity, OpportunityService} from "../opportunity.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";

@Component({
  selector: 'app-list-opportunities',
  templateUrl: './list-opportunities.component.html',
  styleUrls: ['./list-opportunities.component.css']
})
export class ListOpportunitiesComponent implements OnInit {

  opportunities? : Opportunity[];

  constructor(private route: ActivatedRoute, public authService:AuthService,
              public opportunityService: OpportunityService, private dialog: MatDialog) {
  }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      this.opportunities = await this.opportunityService.getOpportunities();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

}
