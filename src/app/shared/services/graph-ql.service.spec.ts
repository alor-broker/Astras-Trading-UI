import { TestBed } from '@angular/core/testing';

import { GraphQlService } from './graph-ql.service';
import { of } from "rxjs";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { Apollo } from "apollo-angular";

describe('GraphQlService', () => {
  let service: GraphQlService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Apollo,
          useValue: {
            watchQuery: jasmine.createSpy('watchQuery').and.returnValue({ valueChanges: of({})})
          }
        },
        {
          provide: ErrorHandlerService,
          useValue: {}
        }
      ]
    });
    service = TestBed.inject(GraphQlService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
