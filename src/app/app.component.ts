import { Component } from '@angular/core';
import {AuthService} from "./auth/auth.service";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'AIESEC HRIS';

  constructor(public authService: AuthService, private router:ActivatedRoute) {
  }

  isActive(route: string) {
    const currentRoute = this.router.snapshot.firstChild?.url[0]?.path;
    return route === currentRoute;
  }
}
