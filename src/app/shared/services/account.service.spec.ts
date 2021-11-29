/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, async, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginFormComponent } from 'src/app/modules/login/components/login-form/login-form.component';
import { SharedModule } from '../shared.module';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        RouterTestingModule.withRoutes([{ path: 'login', pathMatch: 'full', component: LoginFormComponent },])],
      providers: [RouterTestingModule]
    });
    service = TestBed.inject(AccountService);
  });

  it('should inject', () => {
    expect(service).toBeTruthy();
  });
});
