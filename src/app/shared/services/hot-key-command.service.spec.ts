import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { HotKeyCommandService } from './hot-key-command.service';
import {
  BehaviorSubject,
  take,
} from "rxjs";
import { TerminalSettings } from "../models/terminal-settings/terminal-settings.model";
import { DOCUMENT } from "@angular/common";
import {TerminalSettingsService} from "./terminal-settings.service";

describe('HotKeyCommandService', () => {
  let service: HotKeyCommandService;
  let document: Document;

  const terminalSettingsMock = new BehaviorSubject<TerminalSettings>({ hotKeysSettings: {} } as TerminalSettings);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(terminalSettingsMock)
          }
        }
      ]
    });

    service = TestBed.inject(HotKeyCommandService);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process all hot keys', fakeAsync(() => {
      service.commands$.subscribe();

      const hotKeysSettings = {
        cancelOrdersKey: 'a',
        closePositionsKey: 'b',
        centerOrderbookKey: 'c',
        cancelOrderbookOrders: 'd',
        closeOrderbookPositions: 'e',
        reverseOrderbookPositions: 'f',
        buyMarket: 'g',
        sellMarket: 'h',
        sellBestOrder: 'i',
        buyBestOrder: 'j',
      };

      terminalSettingsMock.next({
        hotKeysSettings: hotKeysSettings
      } as TerminalSettings);

      const cases: { key: string, expectedCommandCode: string }[] = [
        { key: hotKeysSettings.cancelOrdersKey, expectedCommandCode: 'cancelLimitOrdersAll' },
        { key: hotKeysSettings.closePositionsKey, expectedCommandCode: 'closePositionsByMarketAll' },
        { key: hotKeysSettings.centerOrderbookKey, expectedCommandCode: 'centerOrderbook' },
        { key: hotKeysSettings.cancelOrderbookOrders, expectedCommandCode: 'cancelLimitOrdersCurrent' },
        { key: hotKeysSettings.closeOrderbookPositions, expectedCommandCode: 'closePositionsByMarketCurrent' },
        { key: hotKeysSettings.reverseOrderbookPositions, expectedCommandCode: 'reversePositionsByMarketCurrent' },
        { key: hotKeysSettings.buyMarket, expectedCommandCode: 'buyMarket' },
        { key: hotKeysSettings.sellMarket, expectedCommandCode: 'sellMarket' },
        { key: hotKeysSettings.sellBestOrder, expectedCommandCode: 'sellBestOrder' },
        { key: hotKeysSettings.buyBestOrder, expectedCommandCode: 'buyBestOrder' },
        { key: '1', expectedCommandCode: '1' },
        { key: '2', expectedCommandCode: '2' },
        { key: '3', expectedCommandCode: '3' },
        { key: '4', expectedCommandCode: '4' },
      ];

      cases.forEach(testCase => {
        const event = new KeyboardEvent('keydown', { key: testCase.key });
        service.commands$.pipe(
          take(1)
        ).subscribe(command => {
          expect(command.type).toBe(testCase.expectedCommandCode);
        });

        document.body.dispatchEvent(event);
        tick();
      });
    })
  );
});
