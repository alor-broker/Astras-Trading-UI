import { TestBed } from '@angular/core/testing';

import { AllInstrumentsService } from './all-instruments.service';
import { of } from "rxjs";
import { GraphQlService } from "../../../shared/services/graph-ql.service";

describe('AllInstrumentsService', () => {
  let service: AllInstrumentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: GraphQlService,
          useValue: {
            watchQuery: jasmine.createSpy('queryForSchema').and.returnValue(of({}))
          }
        }
      ]
    });

    service = TestBed.inject(AllInstrumentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
