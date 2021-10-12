import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {environment} from "../environments/environment";

import { AppComponent } from './app.component';
import { RouterModule } from "@angular/router";
import { AppRoutingModule } from './app-routing.module';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';
import { LoginComponent } from './auth/login/login.component';
import {MAT_DIALOG_DEFAULT_OPTIONS, MatDialogModule} from "@angular/material/dialog";

// Angular fire
import {AngularFireModule} from "@angular/fire/compat";
import { SETTINGS as AUTH_SETTINGS, AngularFireAuthModule} from "@angular/fire/compat/auth";
import { USE_EMULATOR as USE_AUTH_EMULATOR } from '@angular/fire/compat/auth';
import {AngularFireFunctionsModule, USE_EMULATOR} from '@angular/fire/compat/functions';
import {AngularFireStorageModule, BUCKET } from '@angular/fire/compat/storage';

import { LoadingComponent } from './dialogs/loading/loading.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { ErrorComponent } from './dialogs/error/error.component';
import { ProfileComponent } from './profile/profile.component';
import { InitializeComponent } from './profile/initialize/initialize.component';
import {MatCardModule} from "@angular/material/card";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MatButtonModule} from '@angular/material/button';
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import { InviteMemberComponent } from './member/invite-member/invite-member.component';
import {MatSelectModule} from "@angular/material/select";
import { EditProfileComponent } from './dialogs/edit-profile/edit-profile.component';
import { ListMembersComponent } from './member/list-members/list-members.component';
import { MatTableExporterModule } from 'mat-table-exporter';
import {MatTableModule} from "@angular/material/table";
import { StringInputDialogComponent } from './dialogs/string-input-dialog/string-input-dialog.component';
import { TwoStringInputDialogComponent } from './dialogs/two-string-input-dialog/two-string-input-dialog.component';
import { ImportMembersComponent } from './member/import-members/import-members.component';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { AddPositionDialogComponent } from './dialogs/add-position-dialog/add-position-dialog.component';
import {MatDatepickerModule, MatDateRangeInput} from "@angular/material/datepicker";
import {MatNativeDateModule} from "@angular/material/core";
import { OpportunityCreateComponent } from './opportunity/opportunity-create/opportunity-create.component';
import { EditorModule } from "@tinymce/tinymce-angular";
import { ViewOpportunityComponent } from './opportunity/view-opportunity/view-opportunity.component';
import { ListOpportunitiesComponent } from './opportunity/list-opportunities/list-opportunities.component';
import {MatTooltipModule} from '@angular/material/tooltip';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LoadingComponent,
    ErrorComponent,
    ProfileComponent,
    InitializeComponent,
    InviteMemberComponent,
    EditProfileComponent,
    ListMembersComponent,
    StringInputDialogComponent,
    TwoStringInputDialogComponent,
    ImportMembersComponent,
    AddPositionDialogComponent,
    OpportunityCreateComponent,
    ViewOpportunityComponent,
    ListOpportunitiesComponent,
  ],
  imports: [
    BrowserModule,
    RouterModule,
    AppRoutingModule,
    FlexLayoutModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(environment.firebase, "angular-auth-firebase"),
    AngularFireAuthModule,
    AngularFireFunctionsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    ReactiveFormsModule,
    MatSelectModule,
    AngularFireStorageModule,
    MatTableExporterModule,
    MatTableModule,
    MatProgressBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    EditorModule,
    MatTooltipModule
  ],
  providers: [
    { provide: AUTH_SETTINGS, useValue: { appVerificationDisabledForTesting: true } },
    { provide: USE_AUTH_EMULATOR, useValue: environment.production ? undefined : ['http://127.0.0.1:9099', 9099] },
    { provide: USE_EMULATOR, useValue: environment.production? undefined : ['localhost', 5001] },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true} },
    { provide: BUCKET, useValue:  environment.production? 'aiesec-hris.appspot.com' : 'aiesec-hris.appspot.com' },

  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
