import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MemberService} from "../member.service";
import {Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";

@Component({
  selector: 'app-invite-member',
  templateUrl: './invite-member.component.html',
  styleUrls: ['./invite-member.component.css']
})
export class InviteMemberComponent implements OnInit {

  form = new FormGroup({
    email: new FormControl(null, [Validators.required, Validators.email]),
    expa_id: new FormControl(null, [Validators.required]),
    entity: new FormControl(null),
    role: new FormControl(null)
  });

  constructor(private memberService:MemberService, private router:Router) {
  }

  ngOnInit(): void {
  }

  async submitForm() {
    await this.memberService.inviteMember(this.form.value);
    await this.router.navigate(["/profile/" + this.form.get("email")?.value]);
  }

}
