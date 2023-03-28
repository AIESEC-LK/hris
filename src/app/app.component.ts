import { Component } from '@angular/core';
import { AuthService } from "./auth/auth.service";
import { ActivatedRoute, Router } from "@angular/router";

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent {
	title = 'AIESEC HRIS';
	menuStatus: boolean = false;

	constructor(public authService: AuthService, private router: ActivatedRoute, private router2: Router) {
		if (this.authService.isLoggedIn()) {
			this.authService.completeLogin();
		} else {
			let url = window.location.href;
			if (!url.includes("/logout") && !url.includes("/opp/") && !url.includes("/r/") && !url.includes("/opportunities")) {
				this.authService.login();
			}
		}
	}

	isActive(route: string) {
		const currentRoute = this.router.snapshot.firstChild?.url[0]?.path;
		return route === currentRoute;
	}
}
