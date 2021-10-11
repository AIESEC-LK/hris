import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Member, MemberService, CurrentStatus} from "../member/member.service";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";
import {EditProfileComponent} from "../dialogs/edit-profile/edit-profile.component";
import {environment} from "../../environments/environment";
import {StringInputDialogComponent} from "../dialogs/string-input-dialog/string-input-dialog.component";
import {TwoStringInputDialogComponent} from "../dialogs/two-string-input-dialog/two-string-input-dialog.component";
import {AddPositionDialogComponent} from "../dialogs/add-position-dialog/add-position-dialog.component";

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {

  email?:string;
  member?: Member;
  public CurrentStatus = CurrentStatus;

  constructor(private route: ActivatedRoute, public authService:AuthService, private functions: AngularFireFunctions,
              public memberService: MemberService, private dialog: MatDialog, private router: Router) {
  }

  async ngOnInit() {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    if (!this.route.snapshot.paramMap.get("email")) {
      await this.router.navigate(["/profile/" + this.authService.getEmail()]);
      return;
    }
    this.email = <string>this.route.snapshot.paramMap.get("email");

    try {
      this.member = await this.memberService.getMemberInformation(this.email!, false);
      console.log(this.member);

      // fetch a second time with refresh
      this.member = await this.memberService.getMemberInformation(this.email!, true);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.member?.positions.sort(function(a, b) {
      var keyA = new Date(a.start_date),
        keyB = new Date(b.start_date);
      // Compare the 2 dates
      if (keyA < keyB) return 1;
      if (keyA > keyB) return -1;
      return 0;
    });


  }

  edit(editField: string) {
    this.dialog.open(EditProfileComponent, {data: {member: this.member, editField: editField}});
  }

  addTag() {
    const dialogRef = this.dialog.open(StringInputDialogComponent, {
      data: {
        message: "Add new tag for " + this.member?.name,
        confirm_text: "ADD"
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result == null) return;
      this.memberService.addTag(this.member!, result);
    });
  }

  addNewAttachment() {
    const dialogRef = this.dialog.open(TwoStringInputDialogComponent, {
      data: {
        title: "Add new attachment for " + this.member?.name,
        input_name: "Attachment Name",
        input_name_value: null,
        input_value: "Link",
        input_value_value: null,
        confirm_text: "ADD"
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result == null) return;
      await this.memberService.addAttachment(this.member!, result);
    });
  }

  addNewPosition() {
    const dialogRef = this.dialog.open(AddPositionDialogComponent, {
      data: {
        name: this.member?.name
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result == null) return;
      await this.memberService.addPosition(this.member!, result);
    });
  }

}
