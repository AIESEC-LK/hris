import { Injectable } from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";

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
    const opportunities: Opportunity[] =  await getOpportunities({}).toPromise();
    if (opportunities.length == 0) throw {
      message: "No opportunities available",
      details: {
        message: "There are no opportunities available at the moment."
      }
    }
    return opportunities;
  }

  public async deleteOpportunity(data: Opportunity) {
    const deleteOpportunity = this.functions.httpsCallable('opportunity-deleteOpportunity');
    return await deleteOpportunity(data).toPromise();
  }

}
