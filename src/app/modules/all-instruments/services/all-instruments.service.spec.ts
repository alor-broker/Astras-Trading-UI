import { fakeAsync, TestBed, tick } from '@angular/core/testing';

import { AllInstrumentsService } from './all-instruments.service';
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

describe('AllInstrumentsService', () => {
  let service: AllInstrumentsService;
  let httpSpy: HttpClient;
  const apiUrl = 'apiUrl';

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
        },
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl
          }
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

    expect(httpSpy.get).toHaveBeenCalledOnceWith(apiUrl + '/md/v2/Securities/advanced', {params: filters});
  }));
});
