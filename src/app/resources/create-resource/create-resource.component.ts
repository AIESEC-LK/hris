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
import {ResourcesService} from "../resources.service";

@Component({
  selector: 'app-create-resource',
  templateUrl: './create-resource.component.html',
  styleUrls: ['./create-resource.component.css']
})
export class CreateResourceComponent implements OnInit {

  private url_regex = '(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})';

  form = new FormGroup({
    title: new FormControl(null, [Validators.required]),
    functions: new FormControl(null),
    link: new FormControl(null, [Validators.pattern(this.url_regex), Validators.required]),
    keywords: new FormControl(null)
  });

  edit = false;

  functions_list = []

  constructor(private memberService:MemberService, private authService: AuthService, private router:Router,
              private dialog: MatDialog, private functions: AngularFireFunctions, private route: ActivatedRoute,
              private resourceService: ResourcesService) {
  }

  async ngOnInit(): Promise<void> {
    if (!await this.authService.isLoggedIn()) await this.authService.login();

    const getFunctions = this.functions.httpsCallable('config-getFunctions');
    this.functions_list =  await getFunctions(null).toPromise();

  }

  async submitForm() {
    let loadingDialog = this.dialog.open(LoadingComponent);
    try {
      if (!this.form.valid) throw "There was an error with your form";

      const id = await this.resourceService.createResource(this.form.value);
      console.log(id);
      await this.router.navigate(["/resources/" + id]);
    } catch (e) {
      this.dialog.open(ErrorComponent, {data: e});
    } finally {
      loadingDialog.close();
    }
    return;
  }

}
