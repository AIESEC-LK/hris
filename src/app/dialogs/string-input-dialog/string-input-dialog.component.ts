import {Component, Inject, OnInit} from '@angular/core';
import {Member, MemberService} from "../../member/member.service";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-string-input-dialog',
  templateUrl: './string-input-dialog.component.html',
  styleUrls: ['./string-input-dialog.component.css']
})
export class StringInputDialogComponent implements OnInit {

  message: string =  "Enter string";
  confirm_text: string = "OK";
  value?: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    message: string;
    confirm_text: string;
  }, private memberService: MemberService, private dialogRef: MatDialogRef<StringInputDialogComponent>) {
    this.message = data.message;
    this.confirm_text = data.confirm_text;
  }

  ngOnInit(): void {
  }

  async submit() {
    this.dialogRef.close(this.value);
  }

}
