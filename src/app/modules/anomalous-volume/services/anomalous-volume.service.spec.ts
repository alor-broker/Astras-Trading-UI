import { TestBed } from '@angular/core/testing';
import { of, take } from 'rxjs';
import { AnomalousVolumeService } from './anomalous-volume.service';
import { CandlesService } from '../../instruments/services/candles.service';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { HistoryService } from '../../../shared/services/history.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { AnomalousVolumeSettings } from '../models/anomalous-volume-settings.model';
import { AnomalousVolumeItem } from '../models/anomalous-volume-item.model';

describe('AnomalousVolumeService', () => {
  let service: AnomalousVolumeService;
  let localStorageSpy: jasmine.SpyObj<LocalStorageService>;

  const settings: AnomalousVolumeSettings = {
    guid: 'test-guid',
    instruments: [],
    sourceMode: 'manual',
    topTurnoverLimit: 30,
    excludeZeroPositions: true,
    timeframe: '1m',
    windowSize: 30,
    sigmaMultiplier: 2.5,
    soundAlertEnabled: true,
    maxInstruments: 50,
    anomalousVolumeColumns: ['ticker', 'time']
  };

  const oldItem: AnomalousVolumeItem = {
    id: 'MOEX_SBER_1000',
    ticker: 'SBER',
    instrument: 'Сбербанк',
    direction: 'buy',
    lots: 10,
    moneyVolume: 1_000_000,
    changePercent: 0.5,
    buyPercent: 60,
    sellPercent: 40,
    date: '01.01.2026',
    time: '10:00:00',
    detectedAt: 1000,
    sigmaScore: 3
  };

  const newItem: AnomalousVolumeItem = {
    ...oldItem,
    id: 'MOEX_SBER_2000',
    detectedAt: 2000,
    time: '10:01:00'
  };

  beforeEach(() => {
    localStorageSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
    localStorageSpy.getItem.and.returnValue([oldItem, newItem]);

    TestBed.configureTestingModule({
      providers: [
        AnomalousVolumeService,
        {
          provide: CandlesService,
          useValue: {
            getInstrumentLastCandle: jasmine.createSpy('getInstrumentLastCandle').and.returnValue(of(null))
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(of(null))
          }
        },
        {
          provide: HistoryService,
          useValue: {
            getHistory: jasmine.createSpy('getHistory').and.returnValue(of(null))
          }
        },
        {
          provide: LocalStorageService,
          useValue: localStorageSpy
        }
      ]
    });

    service = TestBed.inject(AnomalousVolumeService);
  });

  it('должен восстанавливать уведомления из localStorage и показывать свежие сверху', () => {
    service.watch(settings)
      .pipe(take(1))
      .subscribe(items => {
        expect(items.length).toBe(2);
        expect(items[0].detectedAt).toBe(2000);
        expect(items[1].detectedAt).toBe(1000);
      });

    expect(localStorageSpy.getItem).toHaveBeenCalled();
    expect(localStorageSpy.setItem).toHaveBeenCalled();
  });
});
