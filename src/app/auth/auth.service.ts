import { Injectable } from '@angular/core';
import {AngularFireAuth} from "@angular/fire/compat/auth";
import firebase from "firebase/compat/app";
import {first} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private AlreadyLoggedInException = {
    message: "User is already logged in."
  }

  constructor(private auth: AngularFireAuth) { }

  async login() {
    if (await this.isLoggedIn()) throw this.AlreadyLoggedInException;
    const loginResult = await this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
    console.log("User:", loginResult.user);
    window.location.reload();
  }

  async logout() {
    const logoutResult = await this.auth.signOut();
    console.log("Logout result", logoutResult);
    window.location.reload();
  }

  async isLoggedIn(): Promise<boolean> {
    const logged = await this.auth.authState.pipe(first()).toPromise();
    return logged != null;
  }


}
