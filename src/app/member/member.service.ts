import { Injectable } from '@angular/core';
import {AuthService} from "../auth/auth.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import firebase from "firebase/compat";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";

@Injectable({
  providedIn: 'root'
})
export class MemberService {

  constructor(private functions: AngularFireFunctions, private dialog: MatDialog) {
  }

  public async getMemberInformation(email: string) {
    try {
      const getMemberInformation = this.functions.httpsCallable('getProfileInformation');
      const result = await getMemberInformation({email: email}).toPromise();
      console.log(result);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

  }
}
