import { Component, OnInit } from '@angular/core';
import {AuthService} from "../auth/auth.service";

@Component({
  selector: 'app-title',
  templateUrl: './title.component.html',
  styleUrls: ['./title.component.css']
})
export class TitleComponent implements OnInit {

  constructor(public authService:AuthService) { }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();
  }

}
