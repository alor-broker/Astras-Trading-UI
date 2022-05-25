import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PositionsService } from './positions.service';

describe('PositionsService', () => {
  let service: PositionsService;
  let httpClient: HttpClient;
  let httpClientController: HttpTestingController;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [PositionsService]
    });

    httpClient = TestBed.inject(HttpClient);
    httpClientController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PositionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
