import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { MemberGroup, MemberService } from "../../member/member.service";

@Component({
	selector: 'app-view-group-dialog',
	templateUrl: './view-group-dialog.component.html',
	styleUrls: ['./view-group-dialog.component.css']
})
export class ViewGroupDialogComponent implements OnInit {

	name: string;
	members: string[];

	constructor(@Inject(MAT_DIALOG_DATA) public data: MemberGroup, private memberService: MemberService, private dialogRef: MatDialogRef<ViewGroupDialogComponent>) {
		this.name = data.name;
		this.members = data.members;
	}

	ngOnInit(): void {
	}

}
