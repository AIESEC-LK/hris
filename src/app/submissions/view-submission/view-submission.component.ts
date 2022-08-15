import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../auth/auth.service";
import {MatDialog} from "@angular/material/dialog";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {LoadingComponent} from "../../dialogs/loading/loading.component";
import {Submission, SubmissionService} from "../submission-service.service";
import {Title} from "@angular/platform-browser";

@Component({
  selector: 'app-view-submission',
  templateUrl: './view-submission.component.html',
  styleUrls: ['./view-submission.component.css']
})
export class ViewSubmissionComponent implements OnInit {

  submission?: Submission;
  loading = true;

  constructor(private route: ActivatedRoute, public authService:AuthService,
              public submissionService: SubmissionService, private dialog: MatDialog, private router:Router,
              private titleService:Title) {
  }

  async ngOnInit(): Promise<void> {
    //if (!await this.authService.isLoggedIn()) await this.authService.login();

    try {
      const id = <string>this.route.snapshot.paramMap.get("id");
      this.submission = await this.submissionService.getSubmission(id);
      this.titleService.setTitle(`${this.submission.title} | ASL 360°`);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    }

    this.loading = false;
  }

  async delete(submission: Submission) {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      await this.submissionService.deleteSubmission(submission);
      await this.router.navigate(["/submissions"]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
    return;
  }

  getSubmissionEmbedLink():string {
    return this.submission!.submissionLink;
  }

}
