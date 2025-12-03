import { TestBed } from '@angular/core/testing';

import { BondScreenerService } from './bond-screener.service';
import { of } from "rxjs";
import { GraphQlService } from "../../../shared/services/graph-ql.service";

describe('BondScreenerService', () => {
  let service: BondScreenerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: GraphQlService,
          useValue: {
            watchQuery: jasmine.createSpy('queryForSchema').and.returnValue({ valueChanges: of({})})
          }
        }
      ]
    });
    service = TestBed.inject(BondScreenerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
