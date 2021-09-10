import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Member, MemberService} from "../member/member.service";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  email?:string;
  member?: Member;

  constructor(private route: ActivatedRoute, public authService:AuthService, private functions: AngularFireFunctions,
              private memberService: MemberService, private dialog: MatDialog) {
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

}
