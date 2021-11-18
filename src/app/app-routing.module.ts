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
import {TitleComponent} from "./title/title.component";
import {CreateResourceComponent} from "./resources/create-resource/create-resource.component";
import {ViewResourceComponent} from "./resources/view-resource/view-resource.component";
import {ListResourcesComponent} from "./resources/list-resources/list-resources.component";

const routes: Routes = [
  { path: '', component: TitleComponent },
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
  { path: 'opportunities', component: ListOpportunitiesComponent   },
  { path: 'resources', component: ListResourcesComponent   },
  { path: 'resources/create', component: CreateResourceComponent   },
  { path: 'resources/:id', component: ViewResourceComponent   },
  { path: 'r/:id', component: ViewResourceComponent   },
  { path: 'resources/edit/:id', component: CreateResourceComponent   }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
