import { TestBed } from '@angular/core/testing';

import { NewsService } from './news.service';
import { EnvironmentService } from "./environment.service";
import { commonTestProviders } from "../utils/testing/common-test-providers";
import { GraphQlService } from "./graph-ql.service";
import { EMPTY } from "rxjs";

describe('NewsService', () => {
  let service: NewsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            apiUrl: ''
          }
        },
        ...commonTestProviders,
        {
          provide: GraphQlService,
          useValue: {
            queryForSchema: jasmine.createSpy('queryForSchema').and.returnValue(EMPTY)
          }
        }
      ]
    });
    service = TestBed.inject(NewsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
