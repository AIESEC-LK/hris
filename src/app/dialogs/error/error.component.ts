import { Component, Inject } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { FirebaseError } from 'firebase/app';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.css']
})
export class ErrorComponent {

  title: string = "Error";
  message: string = "Error Message";

  constructor(@Inject(MAT_DIALOG_DATA) public error: any) {

    console.log("Error", error);

    if (error.details != null) {
      this.title = error.message;
      this.message = error.details.message;
      return;
    }

    if (error instanceof FirebaseError) {
      this.title = error.name;
      this.message = error.message
      return;
    }

    this.title = error.name;
    this.message = error.message;
    return;
  }

}
