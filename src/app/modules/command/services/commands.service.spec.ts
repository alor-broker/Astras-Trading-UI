import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CommandsService } from './commands.service';
import { OrderService } from "../../../shared/services/orders/order.service";

describe('CommandsService', () => {
  let service: CommandsService;

  let orderServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    orderServiceSpy = jasmine.createSpyObj(
      'OrderService',
      [
        'submitMarketOrder',
        'submitLimitOrder',
        'submitStopMarketOrder',
        'submitStopLimitOrder',
        'submitLimitOrderEdit'
      ]
    );

    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        CommandsService,
        { provide: OrderService, useValue: orderServiceSpy }
      ]
    });

    service = TestBed.inject(CommandsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
