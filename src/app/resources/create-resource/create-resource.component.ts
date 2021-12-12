import { Component, OnInit } from '@angular/core';
import {Opportunity, OpportunityService} from "../../opportunity/opportunity.service";
import {ErrorComponent} from "../../dialogs/error/error.component";
import {MemberService} from "../../member/member.service";
import {AuthService} from "../../auth/auth.service";
import {ActivatedRoute, Router} from "@angular/router";
import {MatDialog} from "@angular/material/dialog";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {LoadingComponent} from "../../dialogs/loading/loading.component";
import {AngularFireFunctions} from "@angular/fire/compat/functions";
import {Resource, ResourcesService} from "../resources.service";

@Component({
  selector: 'app-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent implements OnInit {

  private url_regex = '(https?://)[^]*'
  form = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    functions: new FormControl(null),
    link: new FormControl(null, [Validators.pattern(this.url_regex), Validators.required]),
    keywords: new FormControl(null)
  });

  edit = false;
  edit_id?: string;

  functions_list = []

  constructor(private memberService:MemberService, private authService: AuthService, private router:Router,
              private dialog: MatDialog, private functions: AngularFireFunctions, private route: ActivatedRoute,
              private resourceService: ResourcesService) {
    if (this.route.snapshot.paramMap.get("id")) {
      this.edit = true;
    }

  }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    if (this.edit) {
      try {
        this.edit_id = <string>this.route.snapshot.paramMap.get("id");
        const resource:Resource = await this.resourceService.getResource(this.edit_id);
        this.form.setValue({
          title: resource.title,
          link: resource.link,
          functions: resource.functions,
          keywords: resource.keywords,
        })
      } catch (e) {
        this.dialog.open(ErrorComponent, {data: e});
      }
    }

    const getFunctions = this.functions.httpsCallable('config-getFunctions');
    this.functions_list =  await getFunctions(null).toPromise();
  }

  async submitForm() {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      if (!this.form.valid) throw "There was an error with your form";

      if (this.edit) await this.resourceService.editResource(this.form.value, this.edit_id!);
      else await this.resourceService.createResource(this.form.value);

      await this.router.navigate(["/resources/"]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
    return;
  }

  getShortUrl():string {
    const value = this.form.value.title;
    return value == undefined ? '' : value.replace(/[^a-z0-9_]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  }


}
