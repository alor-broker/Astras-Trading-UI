/* tslint:disable:no-unused-variable */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed, async, inject } from '@angular/core/testing';
import { provideMockStore } from '@ngrx/store/testing';
import { EvaluationService } from './evaluation.service';

describe('EvaluationService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        EvaluationService,
        provideMockStore()
      ]
    });
  });

  it('should ...', inject([EvaluationService], (service: EvaluationService) => {
    expect(service).toBeTruthy();
  }));
});
