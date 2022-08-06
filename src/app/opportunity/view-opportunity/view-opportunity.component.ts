import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {Opportunity, OpportunityService} from "../opportunity.service";
import {LoadingComponent} from "../../dialogs/loading/loading.component";

@Component({
  selector: 'app-view-opportunity',
  templateUrl: './view-opportunity.component.html',
  styleUrls: ['./view-opportunity.component.css']
})
export class ViewOpportunityComponent implements OnInit {

  opportunity?: Opportunity;
  loading = true;

  private sub: any;

  constructor(private route: ActivatedRoute, public authService:AuthService,
              public opportunityService: OpportunityService, private dialog: MatDialog, private router:Router) {
  }

  async ngOnInit(): Promise<void> {
    // Temporarily disable login check to allow non-added users
    // if (!await this.authService.isLoggedIn()) await this.authService.login();

    this.router.events.subscribe((evt) => {
      if (!(evt instanceof NavigationEnd)) {
          return;
      }
      window.scrollTo(0, 0)
    });

    try {
      this.sub = this.route.params.subscribe(async params => {
         let id = params['id'];
         this.opportunity = undefined;
         this.opportunity = await this.opportunityService.getOpportunity(id);
       });
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
  }

  async delete(opportunity: Opportunity) {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      await this.opportunityService.deleteOpportunity(opportunity);
      await this.router.navigate(["/opportunities"]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
    return;
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
