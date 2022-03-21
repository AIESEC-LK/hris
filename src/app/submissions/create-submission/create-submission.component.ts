import { Component, OnInit } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AuthService} from "../../auth/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {LoadingComponent} from "../../dialogs/loading/loading.component";
import {Submission, SubmissionService} from "../submission-service.service";

@Component({
  selector: 'app-create-submission',
  templateUrl: './create-submission.component.html',
  styleUrls: ['./create-submission.component.css']
})
export class CreateSubmissionComponent implements OnInit {

  private url_regex = '(https?://)[^]*';
  private email_list_regex = /^(([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5}){1,25})+([;, \n](([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5}){1,25})+)*$/;

form = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    description: new FormControl(null, [Validators.required]),
    submissionLink: new FormControl(null, [Validators.pattern(this.url_regex), Validators.required]),
    responsesLink: new FormControl(null, [Validators.pattern(this.url_regex), Validators.required]),
    submitters: new FormControl(null, [Validators.pattern(this.email_list_regex)]),
    deadline: new FormControl(null, [Validators.required])
  });

  edit = false;
  edit_id?: string;

  constructor(private authService: AuthService, private router: Router,
              private dialog: MatDialog, private route: ActivatedRoute, public submissionService: SubmissionService) {
    if (this.route.snapshot.paramMap.get("id")) {
      this.edit = true;
      this.edit_id = this.route.snapshot.paramMap.get("id")!;
    }

  }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    if (this.edit) {
      try {
        const id = <string>this.route.snapshot.paramMap.get("id");
        const submission:Submission = await this.submissionService.getSubmission(id);
        this.form.setValue({
          title: submission.title,
          description: submission.description,
          deadline: submission.deadline,
          responsesLink: submission.responsesLink,
          submissionLink: submission.submissionLink,
          submitters: submission.submitters,
        })
      } catch (e) {
        this.dialog.open(ErrorComponent, {data: e});
      }
    }
  }

  async submitForm() {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      if (!this.form.valid) throw "There was an error with your form";

      let id;
      if (this.edit) id = await this.submissionService.editSubmission(this.form.value, this.edit_id!);
      else id = await this.submissionService.createSubmission(this.form.value);

      await this.router.navigate(["/s/" + id]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
    return;
  }

  getShortUrl(): string {
    const value = this.form.value.title;
    return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  }
}
