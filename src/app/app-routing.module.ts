import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./auth/login/login.component";
import {ProfileComponent} from "./profile/profile.component";
import {InitializeComponent} from "./profile/initialize/initialize.component";
import {InviteMemberComponent} from "./member/invite-member/invite-member.component";
import {ListMembersComponent} from "./member/list-members/list-members.component";
import {ImportMembersComponent} from "./member/import-members/import-members.component";
import {OpportunityCreateComponent} from "./opportunity/opportunity-create/opportunity-create.component";
import {ViewOpportunityComponent} from "./opportunity/view-opportunity/view-opportunity.component";
import {ListOpportunitiesComponent} from "./opportunity/list-opportunities/list-opportunities.component";

const routes: Routes = [
  { path: '', component: ProfileComponent },
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/initialize', component: InitializeComponent },
  { path: 'profile/:email', component: ProfileComponent },
  { path: 'invite', component: InviteMemberComponent   },
  { path: 'members', component: ListMembersComponent   },
  { path: 'members/import', component: ImportMembersComponent   },
  { path: 'opportunities/create', component: OpportunityCreateComponent   },
  { path: 'opportunities/:id', component: ViewOpportunityComponent   },
  { path: 'opportunities/edit/:id', component: OpportunityCreateComponent   },
  { path: 'opportunities', component: ListOpportunitiesComponent   }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
