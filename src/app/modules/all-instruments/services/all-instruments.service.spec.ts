import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AllInstrumentsService } from './all-instruments.service';
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('AllInstrumentsService', () => {
  let service: AllInstrumentsService;
  let httpSpy: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HttpClient,
          useValue: {
            get: jasmine.createSpy('get').and.returnValue(of([]))
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        }
      ]
    });

    httpSpy = TestBed.inject(HttpClient);
    service = TestBed.inject(AllInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should make request with filters', fakeAsync(() => {
    const filters = {limit: 50, offset: 50};
    service.getAllInstruments(filters).subscribe(res => expect(res).toEqual([]));

    tick();

    expect(httpSpy.get).toHaveBeenCalledOnceWith(environment.apiUrl + '/md/v2/Securities/advanced', {params: filters});
  }));
});
