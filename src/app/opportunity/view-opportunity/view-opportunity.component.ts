import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router, NavigationEnd} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {Opportunity, OpportunityService} from "../opportunity.service";
import {LoadingComponent} from "../../dialogs/loading/loading.component";
import { AngularFireAnalytics } from '@angular/fire/compat/analytics';
import {Title} from "@angular/platform-browser";


@Component({
  selector: 'app-view-opportunity',
  templateUrl: './view-opportunity.component.html',
  styleUrls: ['./view-opportunity.component.css']
})
export class ViewOpportunityComponent implements OnInit {

  opportunity?: Opportunity;
  loading = true;
  isLoggedIn:boolean = false;

  private sub: any;

  constructor(private route: ActivatedRoute, public authService:AuthService,
              public opportunityService: OpportunityService, private dialog: MatDialog, private router:Router, private analytics: AngularFireAnalytics,
              private titleService:Title) {
  }

  async ngOnInit(): Promise<void> {
    // Temporarily disable login check to allow non-added users
    // if (!await this.authService.isLoggedIn()) await this.authService.login();    
    this.isLoggedIn = await this.authService.isLoggedIn();

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
        this.titleService.setTitle(`${this.opportunity!.title} | ASL 360°`);
       });
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
    this.analytics.logEvent('opportunity.view', {"id": this.opportunity?.id});
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

  async logApplyClick() {
    this.analytics.logEvent('opportunity.click', {"id": this.opportunity?.id});
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }

}
