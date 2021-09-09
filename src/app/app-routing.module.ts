import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {LoginComponent} from "./auth/login/login.component";
import {ProfileComponent} from "./profile/profile.component";

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'profile/:email', component: ProfileComponent },


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
