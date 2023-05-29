import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { CommandsService } from './commands.service';
import { OrderService } from "../../../shared/services/orders/order.service";
import { Side } from "../../../shared/models/enums/side.model";
import { MarketCommand } from "../models/market-command.model";
import { LimitOrder, MarketOrder, StopLimitOrder, StopMarketOrder, SubmitOrderResult } from "../models/order.model";
import { of } from "rxjs";
import { LimitCommand } from "../models/limit-command.model";
import { StopCommand } from "../models/stop-command.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";

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

  describe('Common checks', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('#submitMarket', () => {
    it('error if command has not been set', (done) => {
      service.submitMarket(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('error if command has been set to null', (done) => {
      service.setMarketCommand(null);

      service.submitMarket(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('correct parameters should be passed', (done) => {
      const side = Side.Sell;
      const command: MarketCommand = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        user: {
          portfolio: 'D1234',
          exchange: 'MOEX'
        }
      };

      service.setMarketCommand(command);

      orderServiceSpy.submitMarketOrder.and.callFake((order: MarketOrder, portfolio: string) => {
        done();

        expect(portfolio).toBe(command.user!.portfolio);
        expect(order.instrument.symbol).toBe(command.instrument.symbol);
        expect(order.instrument.exchange).toBe(command.instrument.exchange);
        expect(order.side).toBe(side);
        expect(order.quantity).toBe(command.quantity);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      service.submitMarket(side).subscribe();
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      service.setMarketCommand({} as MarketCommand);

      orderServiceSpy.submitMarketOrder.and.returnValue(of(expectedResult));

      service.submitMarket(Side.Buy)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setMarketCommand({} as MarketCommand);

      orderServiceSpy.submitMarketOrder.and.returnValue(of(expectedResult));

      service.submitMarket(Side.Sell)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('should update command error', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setMarketCommand({} as MarketCommand);

      orderServiceSpy.submitMarketOrder.and.returnValue(of(expectedResult));

      service.commandError$.subscribe(value => {
        done();
        expect(value).toBeTrue();
      });

      service.submitMarket(Side.Sell).subscribe();
    });
  });

  describe('#submitLimit', () => {
    it('error if command has not been set', (done) => {
      service.submitLimit(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('error if command has been set to null', (done) => {
      service.setLimitCommand(null);

      service.submitLimit(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('correct parameters should be passed', (done) => {
      const side = Side.Sell;
      const command: LimitCommand = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 150,
        user: {
          portfolio: 'D1234',
          exchange: 'MOEX'
        }
      };

      service.setLimitCommand(command);

      orderServiceSpy.submitLimitOrder.and.callFake((order: LimitOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(command.user!.portfolio);
        expect(order.instrument.symbol).toBe(command.instrument.symbol);
        expect(order.instrument.exchange).toBe(command.instrument.exchange);
        expect(order.side).toBe(side);
        expect(order.quantity).toBe(command.quantity);
        expect(order.price).toBe(command.price);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      service.submitLimit(side).subscribe();
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      service.setLimitCommand({} as LimitCommand);

      orderServiceSpy.submitLimitOrder.and.returnValue(of(expectedResult));

      service.submitLimit(Side.Buy)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setLimitCommand({} as LimitCommand);

      orderServiceSpy.submitLimitOrder.and.returnValue(of(expectedResult));

      service.submitLimit(Side.Sell)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('should update command error', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setLimitCommand({} as LimitCommand);

      orderServiceSpy.submitLimitOrder.and.returnValue(of(expectedResult));

      service.commandError$.subscribe(value => {
        done();
        expect(value).toBeTrue();
      });

      service.submitLimit(Side.Sell).subscribe();
    });
  });

  describe('#submitStop market', () => {
    it('error if command has not been set', (done) => {
      service.submitStop(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('error if command has been set to null', (done) => {
      service.setStopCommand(null);

      service.submitStop(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('correct parameters should be passed', (done) => {
      const side = Side.Sell;
      const command: StopCommand = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        user: {
          portfolio: 'D1234',
          exchange: 'MOEX'
        },
        quantity: 100,
        condition: LessMore.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date(),
        linkedOrder: {
          quantity: 1,
          triggerPrice: 1,
          condition: LessMore.Less
        },
        allowLinkedOrder: false
      };

      service.setStopCommand(command);

      orderServiceSpy.submitStopMarketOrder.and.callFake((order: StopMarketOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(command.user!.portfolio);
        expect(order.instrument.symbol).toBe(command.instrument.symbol);
        expect(order.instrument.exchange).toBe(command.instrument.exchange);
        expect(order.side).toBe(side);
        expect(order.quantity).toBe(command.quantity);
        expect(order.condition).toBe(command.condition);
        expect(order.triggerPrice).toBe(command.triggerPrice);
        expect(order.stopEndUnixTime).toBe(command.stopEndUnixTime as Date);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      service.submitStop(side).subscribe();
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      service.setStopCommand({} as StopCommand);

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of(expectedResult));

      service.submitStop(Side.Buy)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setStopCommand({} as StopCommand);

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of(expectedResult));

      service.submitStop(Side.Sell)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('should update command error', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setStopCommand({} as StopCommand);

      orderServiceSpy.submitStopMarketOrder.and.returnValue(of(expectedResult));

      service.commandError$.subscribe(value => {
        done();
        expect(value).toBeTrue();
      });

      service.submitStop(Side.Sell).subscribe();
    });
  });

  describe('#submitStop limit', () => {
    it('error if command has not been set', (done) => {
      service.submitStop(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('error if command has been set to null', (done) => {
      service.setStopCommand(null);

      service.submitStop(Side.Buy).subscribe({
        error: () => {
          done();
          expect().nothing();
        }
      });
    });

    it('correct parameters should be passed', (done) => {
      const side = Side.Sell;
      const command: StopCommand = {
        instrument: {
          symbol: 'ABC',
          exchange: 'MOEX'
        },
        user: {
          portfolio: 'D1234',
          exchange: 'MOEX'
        },
        quantity: 100,
        price: 200,
        condition: LessMore.Less,
        triggerPrice: 50,
        stopEndUnixTime: new Date(),
        linkedOrder: {
          quantity: 1,
          triggerPrice: 1,
          condition: LessMore.Less
        },
        allowLinkedOrder: false
      };

      service.setStopCommand(command);

      orderServiceSpy.submitStopLimitOrder.and.callFake((order: StopLimitOrder, portfolio: string) => {
        done();

        expect(portfolio).toEqual(command.user!.portfolio);
        expect(order.instrument.symbol).toBe(command.instrument.symbol);
        expect(order.instrument.exchange).toBe(command.instrument.exchange);
        expect(order.side).toBe(side);
        expect(order.quantity).toBe(command.quantity);
        expect(order.price).toBe(command.price!);
        expect(order.condition).toBe(command.condition);
        expect(order.triggerPrice).toBe(command.triggerPrice);
        expect(order.stopEndUnixTime).toBe(command.stopEndUnixTime as Date);

        return of({ orderNumber: '123' } as SubmitOrderResult);
      });

      service.submitStop(side).subscribe();
    });

    it('correct success result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: true,
        orderNumber: '123'
      };

      service.setStopCommand({ price: 100 } as StopCommand);

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of(expectedResult));

      service.submitStop(Side.Buy)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('correct failed result should be returned', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setStopCommand({ price: 100 } as StopCommand);

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of(expectedResult));

      service.submitStop(Side.Sell)
      .subscribe(result => {
        done();
        expect(result).toEqual(expectedResult);
      });
    });

    it('should update command error', (done) => {
      const expectedResult: SubmitOrderResult = {
        isSuccess: false
      };

      service.setStopCommand({ price: 100 } as StopCommand);

      orderServiceSpy.submitStopLimitOrder.and.returnValue(of(expectedResult));

      service.commandError$.subscribe(value => {
        done();
        expect(value).toBeTrue();
      });

      service.submitStop(Side.Sell).subscribe();
    });
  });
});
