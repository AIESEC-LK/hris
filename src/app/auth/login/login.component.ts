import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth.service";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  logged = false;

  constructor(public authService: AuthService) {
  }

  async ngOnInit() {
    this.logged = await this.authService.isLoggedIn();
  }

}
