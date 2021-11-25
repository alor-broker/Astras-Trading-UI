/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { TestBed, async, inject } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HandleErrorService } from './handle-error.service';

describe('HandleErrorService: Register', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [HttpClient],
    });
  });

  it('should inject', inject([HandleErrorService], (service: HandleErrorService) => {
    expect(service).toBeTruthy();
  }));
});
