import {Injectable, OnInit} from '@angular/core';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import firebase from "firebase/compat/app";
import {first} from "rxjs/operators";
import {LoadingComponent} from "../dialogs/loading/loading.component";
import {MatDialog} from '@angular/material/dialog';
import {ErrorComponent} from "../dialogs/error/error.component";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private AlreadyLoggedInException:Error  = { name: "Already logged in", message: "You are already logged in." }
  private NotLoggedInException:Error  = { name: "Not logged in", message: "You are not logged in." }

  public logged: boolean = false;
  public role: string[] = [];
  public email: string = "";
  public entity: string = "";

  constructor(private auth: AngularFireAuth, private functions: AngularFireFunctions, private dialog: MatDialog,
              private router: Router) {
    this.isLoggedIn();
  }

  async login() {
    const loadingDialog = this.dialog.open(LoadingComponent);

    try {
      if (this.logged) throw this.AlreadyLoggedInException;
      const loginResult = await this.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
      //console.log("User:", loginResult.user);
      await this.completeLogin();
      //window.location.reload();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    loadingDialog.close();
  }

  async logout() {
    try {
      const logoutResult = await this.auth.signOut();
      console.log("Logout result", logoutResult);
      await this.router.navigate(["/"]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    const user = <firebase.User> await this.auth.authState.pipe(first()).toPromise();
    this.logged = user != null;

    if (this.logged) {
      let tokenResult = await user.getIdTokenResult(true);
      console.log(tokenResult);
      if (!tokenResult.claims['role']) {
        await this.completeLogin();
        tokenResult = await user.getIdTokenResult(true);
      } else {
        this.completeLogin();
      }
      this.role = tokenResult.claims['role'];
      this.email = user.email!;
      this.entity = tokenResult.claims['entity'];
    }
    return this.logged;
  }

  private async completeLogin() {
    //const loading = this.dialog.open(LoadingComponent);
    try {
      const completeLogin = this.functions.httpsCallable('auth-completeLogin');
      const result = await completeLogin(null).toPromise();
      console.log("Tokens", result.tokens)

      this.role = result.tokens['role'];
      this.entity = result.tokens['entity'];

      // If profile is not created
      if (!result.tokens['profile_created']) await this.router.navigate(["/profile/initialize"]);
    }
    catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
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
    if (!this.role) return false;
    return this.role.includes("admin");
  }

}
