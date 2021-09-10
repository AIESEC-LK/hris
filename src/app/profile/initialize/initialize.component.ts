import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MemberService} from "../../member/member.service";
import {AuthService} from "../../auth/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-initialize',
  templateUrl: './initialize.component.html',
  styleUrls: ['./initialize.component.css']
})
export class InitializeComponent implements OnInit {

  form = new FormGroup({
    field_of_study: new FormControl(null, [Validators.required]),
    photo: new FormControl(null, [Validators.required]),
    cv: new FormControl(null),
    facebook: new FormControl(null),
    instagram: new FormControl(null),
    linked_in: new FormControl(null)
  });

  constructor(private memberService:MemberService, private authService: AuthService, private router:Router) { }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();
  }

  async submitForm() {
    await this.memberService.addAdditionalInformation(this.form.value);
    await this.router.navigate(["/profile"]);
  }

  getImageUrl(): string {
    if (this.form.get("photo")?.value != null) return this.form.get("photo")?.value
    return "https://i.pinimg.com/originals/fd/14/a4/fd14a484f8e558209f0c2a94bc36b855.png";
  }

}
