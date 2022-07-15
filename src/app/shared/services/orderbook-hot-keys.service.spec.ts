import { TestBed } from '@angular/core/testing';

import { OrderbookHotKeysService } from './orderbook-hot-keys.service';
import { sharedModuleImportForTests } from "../utils/testing";

describe('HotKeysService', () => {
  let service: OrderbookHotKeysService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
    });
    service = TestBed.inject(OrderbookHotKeysService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
