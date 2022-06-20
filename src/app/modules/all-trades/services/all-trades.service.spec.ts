import { TestBed } from '@angular/core/testing';

import { AllTradesService } from './all-trades.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { sharedModuleImportForTests } from "../../../shared/utils/testing";

describe('AllTradesService', () => {
  let service: AllTradesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      providers: [AllTradesService]
    });
    service = TestBed.inject(AllTradesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
