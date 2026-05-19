import {
  EnvironmentProviders,
  makeEnvironmentProviders
} from '@angular/core';
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {AuthInterceptor} from "./interceptors/auth.interceptor";
import {ApiTokenProviderService} from './services/api-token-provider.service';


export function provideAuthHttpRequests(): EnvironmentProviders {
  return makeEnvironmentProviders([
    ApiTokenProviderService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ]);
}
