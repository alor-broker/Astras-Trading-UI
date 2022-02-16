/* tslint:disable:no-unused-variable */

import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, async, inject } from '@angular/core/testing';
import { PositionsService } from './positions.service';

describe('PositionsService', () => {
  let httpClient: HttpClient;
  let httpClientController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [PositionsService]
    });

    httpClient = TestBed.inject(HttpClient);
    httpClientController = TestBed.inject(HttpTestingController);
  });

  it('should ...', inject([PositionsService], (service: PositionsService) => {
    expect(service).toBeTruthy();
  }));
});
