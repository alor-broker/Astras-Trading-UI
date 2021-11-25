/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, async, inject } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AccountService } from './account.service';

describe('Service: Register', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [HttpClient],
    });
  });

  it('should inject', inject([AccountService], (service: AccountService) => {
    expect(service).toBeTruthy();
  }));
});
