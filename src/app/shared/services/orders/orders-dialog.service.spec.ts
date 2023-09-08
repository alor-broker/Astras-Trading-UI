import { TestBed } from '@angular/core/testing';

import { OrdersDialogService } from './orders-dialog.service';

describe('OrdersDialogService', () => {
  let service: OrdersDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrdersDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
