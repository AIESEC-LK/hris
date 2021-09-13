import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {FirebaseError} from "firebase/app";
import {Member, MemberService} from "../../member/member.service";

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent implements OnInit {

  member?: Member;
  editField?: string;

  oldValue?: string;
  newValue?: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    editField: string;
    member: Member;
  }, private memberService: MemberService, private dialogRef: MatDialogRef<EditProfileComponent>) {
    this.member = data.member;
    this.editField = data.editField;
    // @ts-ignore
    this.oldValue = this.member[this.editField];
    // @ts-ignore
    this.newValue = this.member[this.editField];
  }

  ngOnInit(): void {
  }

  async edit() {
    this.memberService.edit(this.member!, this.editField!, this.newValue!);
    this.dialogRef.close();
  }
}
