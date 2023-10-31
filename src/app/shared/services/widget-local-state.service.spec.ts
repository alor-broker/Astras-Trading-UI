import { TestBed } from '@angular/core/testing';

import { WidgetLocalStateService } from './widget-local-state.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../utils/testing";

describe('WidgetLocalStateService', () => {
  let service: WidgetLocalStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(WidgetLocalStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
