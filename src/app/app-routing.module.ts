import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./auth/login/login.component";
import {ProfileComponent} from "./profile/profile.component";
import {InitializeComponent} from "./profile/initialize/initialize.component";
import {InviteMemberComponent} from "./member/invite-member/invite-member.component";

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'profile/initialize', component: InitializeComponent },
  { path: 'profile/:email', component: ProfileComponent },
  { path: 'invite', component: InviteMemberComponent   },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
