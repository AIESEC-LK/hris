import {Injectable} from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import {LoadingComponent} from "../dialogs/loading/loading.component";
import {Router} from "@angular/router";

export interface Member {
  name: string,
  email: string,
  expa_id: number,
  entity: string,
  phone: string,
  dob: string,
  gender: string,
  positions: Position[],
  photo: string,
  social_media: SocialMedia,
  current_status: CurrentStatus,
}

export interface Position {
  name: string,
  start_date: string,
  end_date: string,
  function:string,
  entity: string
}

export interface SocialMedia {
  facebook: string,
  instagram: string,
  linked_in: string
}

export enum CurrentStatus {
  ACTIVE = "ACTIVE",
  PROBATION = "PROBATION",
  TERMINATED = "TERMINATED",
  ALUMNI = "ALUMNI"
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {

  constructor(private functions: AngularFireFunctions, private dialog:MatDialog, private router: Router) {

  }

  public async getMemberInformation(email: string): Promise<Member> {
      const getMemberInformation = this.functions.httpsCallable('getProfileInformation');
      return await getMemberInformation({email: email}).toPromise();
  }

  public async addAdditionalInformation(data: {}) {
    const loadingDialog = this.dialog.open(LoadingComponent);
    try {
      const addAdditionalInformation = this.functions.httpsCallable('addAdditionalInformation');
      await addAdditionalInformation(data).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
    loadingDialog.close();
  }

  public async inviteMember(data: {}) {
    const loadingDialog = this.dialog.open(LoadingComponent);
    try {
      const inviteMember = this.functions.httpsCallable('inviteMember');
      await inviteMember(data).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
    loadingDialog.close();
  }

  async changeCurrentStatus(member: Member, newStatus: CurrentStatus) {
    member.current_status = newStatus;
    try {
      const changeCurrentStatus = this.functions.httpsCallable('changeCurrentStatus');
      await changeCurrentStatus({
        email: member.email,
        current_status: member.current_status
      }).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

}
