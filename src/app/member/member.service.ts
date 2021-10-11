import {Injectable} from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import {LoadingComponent} from "../dialogs/loading/loading.component";
import {Router} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireStorage} from "@angular/fire/compat/storage";

export interface Member {
  name: string,
  email: string,
  expa_id: number,
  entity: string,
  phone: string,
  dob: string,
  joined_date: string,
  gender: string,
  positions: Position[],
  unofficial_positions: Position[],
  photo: string,
  cv: string,
  social_media: SocialMedia,
  current_status: CurrentStatus,
  tags: string[],
  faculty: string,
  field_of_study: string
  attachments: Attachment[],
}

export interface Position {
  name: string,
  start_date: string,
  end_date: string,
  function:string,
  entity: string
  type: string
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

export interface Attachment {
  name: string,
  value: string
}

@Injectable({
  providedIn: 'root'
})
export class MemberService {

  constructor(private functions: AngularFireFunctions, private dialog:MatDialog, private router: Router,
              private authService: AuthService, private storage: AngularFireStorage) {
    //if (!environment.production) this.storage.storage.useEmulator('localhost', 9199);
  }

  public async getMemberInformation(email: string, refresh: boolean = false): Promise<Member> {
      const getMemberInformation = this.functions.httpsCallable('member-getProfileInformation');
      return await getMemberInformation({email: email, refresh: refresh}).toPromise();
  }

  public async addAdditionalInformation(data: {}) {
    const loadingDialog = this.dialog.open(LoadingComponent);
    try {
      const addAdditionalInformation = this.functions.httpsCallable('member-addAdditionalInformation');
      await addAdditionalInformation(data).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
    loadingDialog.close();
  }

  public async inviteMember(data: {}) {
    const loadingDialog = this.dialog.open(LoadingComponent);
    try {
      const inviteMember = this.functions.httpsCallable('member-inviteMember');
      await inviteMember(data).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
    loadingDialog.close();
  }

  async changeCurrentStatus(member: Member, newStatus: CurrentStatus) {
    member.current_status = newStatus;
    try {
      const changeCurrentStatus = this.functions.httpsCallable('member-changeCurrentStatus');
      await changeCurrentStatus({
        email: member.email,
        current_status: member.current_status
      }).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

  canEdit(member: Member): boolean {
    return this.authService.isEBOrAbove() || this.authService.getEmail() == member.email;
  }

  async edit(member: Member, editField: string, newValue: any) {
    try {
      const editProfileField = this.functions.httpsCallable('member-editProfileField');
      await editProfileField({
        email: member.email,
        editField: editField,
        newValue: newValue
      }).toPromise();
      // @ts-ignore
      MemberService.changeField(member, editField, newValue);
      console.log(member);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }
  }

  async uploadFile(file: File): Promise<string> {
    const fileName = Date.now().toString() + "_" + file.name;
    const ref = this.storage.ref(fileName);
    const x = await ref.put(file);
    console.log("X", x);
    return fileName;
  }

  public async getMembers(): Promise<Member[]> {
    const getMembers = this.functions.httpsCallable('member-getMembers');
    return <Member[]> await getMembers({}).toPromise();
  }

  private static changeField(member: Member, path: string, value: string) {
    var schema = member;  // a moving reference to internal objects within obj
    var pList = path.split('.');
    var len = pList.length;
    for(var i = 0; i < len-1; i++) {
      var elem = pList[i];
      // @ts-ignore
      if( !schema[elem] ) schema[elem] = {}
      // @ts-ignore
      schema = schema[elem];
    }

    // @ts-ignore
    schema[pList[len-1]] = value;
  }

  public getCurrentFunctions(member: Member): string[] {
    let functions: string[] = [];

    const today: Date = new Date();
    for (let position of this.getPositions(member)) {
      const end_date: Date = new Date(Date.parse(position.end_date));
      if (end_date < today) continue;
      functions.push(position.function);
    }

    return [...new Set(functions)];
  }

  public getCurrentRoles(member: Member): string[] {
    let roles: string[] = [];

    const today: Date = new Date();
    for (let position of this.getPositions(member)) {
      const end_date: Date = new Date(Date.parse(position.end_date));
      if (end_date < today) continue;
      roles.push(position.name);
    }

    return [...new Set(roles)];
  }

  public getCurrentEntities(member: Member): string[] {
    let entities: string[] = [];

    const today: Date = new Date();
    for (let position of this.getPositions(member)) {
      const end_date: Date = new Date(Date.parse(position.end_date));
      if (end_date < today) continue;
      entities.push(position.entity);
    }

    if (entities.length == 0) entities.push(member.entity);

    return [...new Set(entities)];
  }

  public async deleteTag(member: Member, tag: string): Promise<void> {
    member.tags = member.tags.filter(item => item !== tag);
    await this.edit(member, "tags", member.tags);
  }

  public async addTag(member: Member, tag: string): Promise<void> {
    if (member.tags == null) member.tags = [tag];
    else member.tags.unshift(tag);
    await this.edit(member, "tags", member.tags);
  }

  public async addAttachment(member: Member, attachment: Attachment): Promise<void> {
    if (member.attachments == null) member.attachments = [attachment];
    else member.attachments.push(attachment);
    await this.edit(member, "attachments", member.attachments);
  }

  public async deleteAttachment(member: Member, attachment: Attachment): Promise<void> {
    member.attachments = member.attachments.filter(item => item !== attachment);
    await this.edit(member, "attachments", member.attachments);
  }

  public async addPosition(member: Member, position: Position): Promise<void> {
    if (member.unofficial_positions == null) member.unofficial_positions = [position];
    else member.unofficial_positions.push(position);
    await this.edit(member, "unofficial_positions", member.unofficial_positions);
  }

  public getPositions(member: Member): Position[] {
    let positions: Position[] = [];
    for (const position of member.positions) {
      position.type = "official";
      positions.push(position);
    }
    if (member.unofficial_positions != null) {
      for (const position of member.unofficial_positions) {
        position.type = "unofficial";
        positions.push(position);
      }
    }

    positions.sort(function(a, b) {
      var keyA = new Date(a.start_date),
        keyB = new Date(b.start_date);
      // Compare the 2 dates
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
    });

    return positions;
  }

  public async deletePosition(member: Member, position: Position): Promise<void> {
    member.unofficial_positions = member.unofficial_positions.filter(item => item !== position);
    await this.edit(member, "unofficial_positions", member.unofficial_positions);
  }



}
