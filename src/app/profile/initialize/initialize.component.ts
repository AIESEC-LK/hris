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

  private url_regex = '(https?://)?([\\da-z.-]+)\\.([a-z.]{2,6})[/\\w .-]*/?';

  form = new FormGroup({
    field_of_study: new FormControl(null, [Validators.required]),
    photo: new FormControl(null, [Validators.required, Validators.pattern(this.url_regex)]),
    cv: new FormControl(null),
    facebook: new FormControl(null, [Validators.pattern(this.url_regex)]),
    instagram: new FormControl(null, [Validators.pattern(this.url_regex)]),
    linked_in: new FormControl(null, [Validators.pattern(this.url_regex)])
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
