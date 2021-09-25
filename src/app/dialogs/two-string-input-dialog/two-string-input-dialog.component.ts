import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MemberService} from "../../member/member.service";

@Component({
  selector: 'app-two-string-input-dialog',
  templateUrl: './two-string-input-dialog.component.html',
  styleUrls: ['./two-string-input-dialog.component.css']
})
export class TwoStringInputDialogComponent implements OnInit {

  title: string =  "Enter information";

  input_name: string = "Name";
  input_name_value:string = "";

  input_value: string = "Value";
  input_value_value: string = "";

  confirm_text: string = "OK";

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    title: string;
    input_name: string ;
    input_name_value:string;

    input_value: string;
    input_value_value: string;
    confirm_text: string;
  }, private memberService: MemberService, private dialogRef: MatDialogRef<TwoStringInputDialogComponent>) {
    this.title = data.title;
    this.input_name = data.input_name;
    this.input_name_value = data.input_name_value;
    this.input_value = data.input_value;
    this.input_value_value = data.input_value_value;
    this.confirm_text = data.confirm_text;
  }

  ngOnInit(): void {
  }

  async submit() {
    this.dialogRef.close({
      name: this.input_name_value,
      value: this.input_value_value
    });
  }

}
