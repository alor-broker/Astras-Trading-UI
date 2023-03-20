import { TestBed } from '@angular/core/testing';

import { TreemapService } from './treemap.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

describe('TreemapService', () => {
  let service: TreemapService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        }
      ]
    });
    service = TestBed.inject(TreemapService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
