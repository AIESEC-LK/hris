import { Injectable, OnInit } from '@angular/core';
import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFireFunctions } from "@angular/fire/compat/functions";
import firebase from "firebase/compat/app";
import "firebase/compat/auth"
import { LoadingComponent } from "../dialogs/loading/loading.component";
import { MatDialog } from '@angular/material/dialog';
import { ErrorComponent } from "../dialogs/error/error.component";
import { Router } from "@angular/router";
import { first } from "rxjs/operators";


@Injectable({
	providedIn: 'root'
})
export class AuthService {

	private AlreadyLoggedInException: Error = { name: "Already logged in", message: "You are already logged in." }
	private NotLoggedInException: Error = { name: "Not logged in", message: "You are not logged in." }

	public logged: boolean = false;
	public role: string[] = [];
	public email: string = "";
	public entity: string = "";

	constructor(private auth: AngularFireAuth, private functions: AngularFireFunctions, private dialog: MatDialog,
		private router: Router) {
		this.logged = sessionStorage.getItem("logged") === "true";

		if (this.logged) {
			this.role = sessionStorage.getItem("role")!.split(",");
			this.email = sessionStorage.getItem("email")!;
			this.entity = sessionStorage.getItem("entity")!;
		}
	}

	async login() {
		const user = <firebase.User>await this.auth.authState.pipe(first()).toPromise();
		if (!!user) {
			this.completeLogin();
			return;
		}

		const loadingDialog = this.dialog.open(LoadingComponent);
		try {
			if (this.logged) throw this.AlreadyLoggedInException;
			await this.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}

		loadingDialog.close();
	}

	async logout() {
		try {
			await this.auth.signOut();
			this.logged = false;
			sessionStorage.clear();
			await this.router.navigate(["/logout"]);
		} catch (e) {
			this.dialog.open(ErrorComponent, { data: e });
		}
	}

	public isLoggedIn(): boolean {
		return this.logged;
	}

	public async completeLogin() {
		//const loading = this.dialog.open(LoadingComponent);
		try {
			const completeLogin = this.functions.httpsCallable('auth-completeLogin');
			const result = await completeLogin(null).toPromise();

			this.role = result.tokens['role'];
			this.entity = result.tokens['entity'];
			this.email = result.tokens['email'];
			this.logged = true;

			//if role is array
			if (Array.isArray(this.role)) sessionStorage.setItem("role", this.role.join(","));
			else sessionStorage.setItem("role", this.role);

			sessionStorage.setItem("entity", this.entity);
			sessionStorage.setItem("email", this.email);
			sessionStorage.setItem("logged", "true");

			// If profile is not created
			if (!result.tokens['profile_created']) await this.router.navigate(["/profile/initialize"]);
		}
		catch (e) {
			this.auth.signOut();
			sessionStorage.clear();
			this.dialog.open(ErrorComponent, { data: e });
		} finally {
			//loading.close();
		}
	}

	public getEmail(): string {
		return this.email;
	}

	public getEntity(): string {
		return this.entity;
	}

	public isEBOrAbove(): boolean {
		if (!this.role) return false;
		if (this.role.includes("admin")) return true;
		if (this.role.includes("eb")) return true;
		return false;
	}

	public isAdmin(): boolean {
		(async () => {
			await this.completeLogin();
		});

		if (!this.role) return false;
		return this.role.includes("admin");
	}
}
