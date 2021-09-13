import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Member, MemberService, CurrentStatus} from "../member/member.service";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import {EditProfileComponent} from "../dialogs/edit-profile/edit-profile.component";
import {environment} from "../../environments/environment";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  email?:string;
  member?: Member;
  public CurrentStatus = CurrentStatus;

  constructor(private route: ActivatedRoute, public authService:AuthService, private functions: AngularFireFunctions,
              public memberService: MemberService, private dialog: MatDialog) {
  }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    if (!this.route.snapshot.paramMap.get("email")) this.email = await this.authService.getEmail();
    else this.email = <string>this.route.snapshot.paramMap.get("email");

    try {
      this.member = await this.memberService.getMemberInformation(this.email!);
      console.log(this.member);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

  edit(editField: string) {
    this.dialog.open(EditProfileComponent, {data: {member: this.member, editField: editField}});
  }

  public getImageBaseUrl(): string {
    if (!environment.production) return "http://localhost:9199/v0/b/aiesec-hris.appspot.com/o/";
    return "https://firebasestorage.googleapis.com/v0/b/aiesec-hris.appspot.com/o/";
  }
}
