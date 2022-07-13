import { TestBed } from '@angular/core/testing';

import { HotKeysService } from './hot-keys.service';
import { sharedModuleImportForTests } from "../utils/testing";

describe('HotKeysService', () => {
  let service: HotKeysService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
    });
    service = TestBed.inject(HotKeysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
