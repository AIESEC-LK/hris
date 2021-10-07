import { Injectable } from '@angular/core';
import {LoadingComponent} from "../dialogs/loading/loading.component";
import {ErrorComponent} from "../dialogs/error/error.component";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {MatDialog} from "@angular/material/dialog";
import {Router} from "@angular/router";
import {AuthService} from "../auth/auth.service";
import {AngularFireStorage} from "@angular/fire/compat/storage";

export interface Opportunity {
  id: string,
  title: string,
  photo?: string,
  description: string,
  link: string,
  deadline: string
  entity: string
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {

  constructor(private functions: AngularFireFunctions) { }

  public async createOpportunity(data: Opportunity) {
    const createOpportunity = this.functions.httpsCallable('opportunity-createOpportunity');
    return await createOpportunity(data).toPromise();
  }

  public async getOpportunity(id: string) {
    const getOpportunity = this.functions.httpsCallable('opportunity-getOpportunity');
    return await getOpportunity({id: id}).toPromise();
  }

  public async editOpportunity(data: Opportunity) {
    if (!data.photo) delete data.photo;
    const editOpportunity = this.functions.httpsCallable('opportunity-editOpportunity');
    return await editOpportunity(data).toPromise();
  }

  public async getOpportunities() {
    const getOpportunities = this.functions.httpsCallable('opportunity-getOpportunities');
    return await getOpportunities({}).toPromise();
  }

}
