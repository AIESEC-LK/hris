import { Injectable } from '@angular/core';
import {AngularFireFunctions} from "@angular/fire/compat/functions";

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

}
