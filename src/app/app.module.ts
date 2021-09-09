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
import { LoadingComponent } from './dialogs/loading/loading.component';
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import { ErrorComponent } from './dialogs/error/error.component';




@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    LoadingComponent,
    ErrorComponent
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
    MatDialogModule
  ],
  providers: [
    { provide: AUTH_SETTINGS, useValue: { appVerificationDisabledForTesting: true } },
    { provide: USE_AUTH_EMULATOR, useValue: environment.production ? undefined : ['http://127.0.0.1:9099', 9099] },
    { provide: USE_EMULATOR, useValue: environment.production? undefined : ['localhost', 5001] },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: {hasBackdrop: true} }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
