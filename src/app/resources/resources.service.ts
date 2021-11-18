import { Injectable } from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Opportunity} from "../opportunity/opportunity.service";

export interface Resource {
  id?: string,
  title: string,
  link: string,
  functions?: string[],
  keywords?: string[]
}

@Injectable({
  providedIn: 'root'
})
export class ResourcesService {

  constructor(private functions: AngularFireFunctions) { }

  public async createResource(data: Resource) {
    const createResource = this.functions.httpsCallable('resource-createResource');
    return await createResource(data).toPromise();
  }

  public async getResource(id: string) {
    const getOpportunity = this.functions.httpsCallable('resource-getResource');
    return await getOpportunity({id: id}).toPromise();
  }

  public async getResources() {
    const getResources = this.functions.httpsCallable('resource-getResources');
    const resources: Resource[] =  await getResources({}).toPromise();
    if (resources.length == 0) throw {
      message: "No opportunities available",
      details: {
        message: "There are no opportunities available at the moment."
      }
    }
    return resources;
  }

  public async editResource(data: Resource, id: string) {
    data = {
      id: id,
      ...data
    }
    const editResource = this.functions.httpsCallable('resource-editResource');
    return await editResource(data).toPromise();
  }

  public async deleteResource(data: Resource) {
    const deleteResource = this.functions.httpsCallable('resource-deleteResource');
    return await deleteResource(data).toPromise();
  }

  public static getFunctions(resources: Resource[]): string[] {
    let functions: string[] = [];
    for (let resource of resources) {
      functions = functions.concat(resource.functions!);
    }
    return [...new Set(functions)];
  }

}
