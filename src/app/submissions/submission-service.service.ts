import { Injectable } from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {LoadingComponent} from "../dialogs/loading/loading.component";
import {ErrorComponent} from "../dialogs/error/error.component";
import {MatDialog} from "@angular/material/dialog";

export interface Submission {
  id?: string,
  title: string,
  description: string,
  submissionLink: string,
  responsesLink: string,
  submitters: string[],
  deadline: string,
  entity?: string,
  responseList?: string[]
}

@Injectable({
  providedIn: 'root'
})
export class SubmissionService {

  constructor(private functions: AngularFireFunctions, private dialog: MatDialog) { }

  public async createSubmission(data: Submission):Promise<string> {
    const createSubmission = this.functions.httpsCallable('submission-createSubmission');
    data.submitters = (<string><unknown>data.submitters).split(/[ ,\n]+/);
    data.submitters = [...new Set(data.submitters)];
    return await createSubmission(data).toPromise();
  }

  public async editSubmission(data: Submission, id: string):Promise<string> {
    const editSubmission = this.functions.httpsCallable('submission-editSubmission');
    data.submitters = (<string><unknown>data.submitters).split(/[ ,\n]+/);
    data.submitters = [...new Set(data.submitters)];
    return await editSubmission({
      id: id,
      ...data
    }).toPromise();
  }

  public async getSubmission(id: string): Promise<Submission> {
    const getSubmission = this.functions.httpsCallable('submission-getSubmission');
    return await getSubmission({id: id}).toPromise();
  }

  public async deleteSubmission(data: Submission) {
    const deleteSubmission = this.functions.httpsCallable('submission-deleteSubmission');
    return await deleteSubmission(data).toPromise();
  }

  public getNotSubmitted(submission: Submission) {
    const intendedSubmitters: string[] = submission.submitters;
    const responseList: string[] = submission.responseList!;
    return (intendedSubmitters.filter(x => !responseList.includes(x)));
  }

  public async sendReminder(data: Submission) {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      const sendReminder = this.functions.httpsCallable('submission-sendReminder');
      await sendReminder(data).toPromise();
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
  }



}
