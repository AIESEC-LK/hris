import {Component, Inject, OnInit} from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {MemberService} from "../../member/member.service";

@Component({
  selector: 'app-add-position-dialog',
  templateUrl: './add-position-dialog.component.html',
  styleUrls: ['./add-position-dialog.component.css']
})
export class AddPositionDialogComponent implements OnInit {

  form = new FormGroup({
    name: new FormControl(null, [Validators.required]),
    function: new FormControl(null, [Validators.required]),
    entity: new FormControl(null, [Validators.required]),
    //start_date: new FormControl(null, [Validators.required, Validators.pattern("^\\d{4}\\-(0?[1-9]|1[012])\\-(0?[1-9]|[12][0-9]|3[01])$\n")]),
    start_date: new FormControl(null, [Validators.required]),
    //end_date: new FormControl(null, [Validators.required, Validators.pattern("^\\d{4}\\-(0?[1-9]|1[012])\\-(0?[1-9]|[12][0-9]|3[01])$\n")]),
    end_date: new FormControl(null, [Validators.required]),
  });

  name:string = "Name";

  constructor(@Inject(MAT_DIALOG_DATA) public data: {
    name: string;
  }, private memberService: MemberService, private dialogRef: MatDialogRef<AddPositionDialogComponent>) {
    this.name = data.name;
  }

  ngOnInit(): void {
  }

  async submit() {
    this.dialogRef.close(this.form.value);
  }


}
