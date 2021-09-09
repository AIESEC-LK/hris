import { Component, OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {MemberService} from "../member/member.service";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  email?:string;

  constructor(private route: ActivatedRoute, public authService:AuthService, private functions: AngularFireFunctions,
              private memberService: MemberService) {
    if (!this.route.snapshot.paramMap.get("email")) return;
    this.email = <string>this.route.snapshot.paramMap.get("email");
  }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    await this.memberService.getMemberInformation(this.email!);
  }

}
