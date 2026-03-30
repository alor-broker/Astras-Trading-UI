import {enableProdMode} from '@angular/core';

import {environment} from './environments/environment';
import '@angular/common/locales/global/ru';
import '@angular/common/locales/global/en';
import '@angular/common/locales/global/hy';
import {bootstrapApplication} from '@angular/platform-browser';
import {AppComponent} from './app/app.component';
import {appConfig} from "./app/app.config";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig)
  .catch(err => console.error(err));
