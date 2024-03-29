import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {MemberService} from "../member.service";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Title} from "@angular/platform-browser";

export interface Log {
  status: string,
  email: string,
  messages?: string[]
}

@Component({
  selector: 'app-import-members',
  templateUrl: './import-members.component.html',
  styleUrls: ['./import-members.component.css']
})
export class ImportMembersComponent implements OnInit {

  form = new FormGroup({
    file: new FormControl(null, [Validators.required]),
  });

  file_name?: string;
  file?: any;

  importing: boolean = false;
  numEntries?: number;
  current_import?: number;
  logs?: Log[];

  constructor(private dialog: MatDialog, private memberService:MemberService, private functions: AngularFireFunctions,
    private titleService:Title) {
      this.titleService.setTitle(`Import Members | ASL 360°`);
    }

  ngOnInit(): void {
  }

  submitForm() {

    this.logs = [];
    this.importing = true;

    const myFile = this.file;
    const reader = new FileReader();
    const original = this;

    reader.addEventListener('load', async function (e) {
      // @ts-ignore
      let csvdata: string = e.target.result!;

      let newLinebrk = csvdata.split("\r\n");
      original.numEntries = newLinebrk.length - 1;

      for (let i = 1; i < newLinebrk.length; i++) {
        const row = newLinebrk[i].split(",");
        const error_messages = ImportMembersComponent.validate(row);

        if (error_messages.length == 0) {
          let data:any = {
            email: row[0],
            name: "x",
            expa_id: ""
          };
          if (row[1]) data['name'] = row[1];
          if (row[2]) data['expa_id'] = row[2];

          try {
            const inviteMember = original.functions.httpsCallable('member-inviteMember');
            await inviteMember(data).toPromise();
          }
          catch (e) {
            error_messages.push(e);
          }
        }

        if (error_messages.length == 0) {
          original.logs!.push({
            status: "success",
            email: row[0]
          });
        }
        else original.logs!.push({
          status: "error",
          email: row[0],
          messages: error_messages
        });
      }

      original.importing = false;
    });

    reader.readAsBinaryString(myFile);
  }

  onFileSelected(event: any, name:string){
    this.logs = [];
    const file:File = event.target.files[0];
    // @ts-ignore
    this.file = file;
    if (file) {
      // @ts-ignore
      this.file_name = file.name;
    }
  }

  private static validate(row: string[]): string[] {
    let messages:string[] = [];

    if (!ImportMembersComponent.validateEmail(row[0])) {
      messages.push("Invalid email address: " + row[0]);
    }

    if (!ImportMembersComponent.validateExpaId(row[2])) {
      messages.push("Invalid EXPA ID: " + row[2]);
    }
    return messages;
  }

  private static validateEmail(email: string) {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  private static validateExpaId(id: string) {
    if (!id) return true;
    const id_num = parseInt(id);
    return (id_num >= 1000000 && id_num <= 9999999)
  }

}
