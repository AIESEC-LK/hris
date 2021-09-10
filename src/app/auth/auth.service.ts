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

  public logged: boolean = false;

  constructor(private auth: AngularFireAuth, private functions: AngularFireFunctions, private dialog: MatDialog,
              private router: Router) {
    this.isLoggedIn();
  }

  async login() {
    const loadingDialog = this.dialog.open(LoadingComponent);

    try {
      if (this.logged) throw this.AlreadyLoggedInException;
      const loginResult = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      console.log("User:", loginResult.user);
      await this.completeLogin();
      window.location.reload();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    loadingDialog.close();
  }

  async logout() {
    try {
      const logoutResult = await this.auth.signOut();
      console.log("Logout result", logoutResult);
      window.location.reload();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

  public async isLoggedIn(): Promise<boolean> {
    const logged = await this.auth.authState.pipe(first()).toPromise();
    this.logged = logged != null;
    return logged != null;
  }

  private async completeLogin() {
    const completeLogin = this.functions.httpsCallable('completeLogin');
    const result = await completeLogin(null).toPromise();
    console.log("Tokens", result.tokens)

    // If profile is not created
    if (!result.profile_created) await this.router.navigate(["/profile/initialize"]);
  }

  public async getEmail(): Promise<string> {
    const user = await this.auth.authState.pipe(first()).toPromise();
    if (user != null) return user.email!;
    return "";
  }

}
