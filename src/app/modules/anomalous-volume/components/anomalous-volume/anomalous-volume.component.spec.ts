import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AnomalousVolumeComponent } from './anomalous-volume.component';
import { AnomalousVolumeService } from '../../services/anomalous-volume.service';
import { AnomalousVolumeSettings, AnomalousVolumeSourceMode } from '../../models/anomalous-volume-settings.model';
import { AnomalousVolumeItem } from '../../models/anomalous-volume-item.model';
import { NzContextMenuService } from 'ng-zorro-antd/dropdown';
import { provideMockStore } from '@ngrx/store/testing';
import { TerminalSettingsService } from '../../../../shared/services/terminal-settings.service';
import { TranslocoTestsModule } from '../../../../shared/utils/testing/translocoTestsModule';
import { Component, input, output } from '@angular/core';
import { TableConfig } from '../../../../shared/models/table-config.model';
import { InfiniteScrollTableComponent } from '../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component';

function thisIsSorted(values: (string | number)[], asc: boolean): boolean {
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const cmp = typeof prev === 'string' && typeof curr === 'string'
      ? prev.localeCompare(curr)
      : Number(prev) - Number(curr);

    if (asc && cmp > 0) {
      return false;
    }

    if (!asc && cmp < 0) {
      return false;
    }
  }

  return true;
}

@Component({
  selector: 'ats-infinite-scroll-table',
  template: ''
})
class InfiniteScrollTableMockComponent {
  readonly tableConfig = input<TableConfig<AnomalousVolumeItem> | null>(null);
  readonly data = input<AnomalousVolumeItem[]>([]);
  readonly isLoading = input(false);
  readonly tableContainerHeight = input(0);
  readonly tableContainerWidth = input(0);
  readonly filterApplied = output<Record<string, unknown>>();
}

describe('AnomalousVolumeComponent', () => {
  let fixture: ComponentFixture<AnomalousVolumeComponent>;
  let component: AnomalousVolumeComponent;

  const settings: AnomalousVolumeSettings = {
    guid: 'test-guid',
    instruments: [],
    sourceMode: AnomalousVolumeSourceMode.Manual,
    topTurnoverLimit: 30,
    excludeZeroPositions: true,
    timeframe: '1m',
    windowSize: 30,
    sigmaMultiplier: 2.5,
    soundAlertEnabled: false,
    showLargeTrades: true,
    largeTradeMinVolume: 10000,
    maxInstruments: 50,
    anomalousVolumeColumns: [
      'eventType',
      'ticker',
      'instrument',
      'lots',
      'moneyVolume',
      'changePercent',
      'buyPercent',
      'sellPercent',
      'date',
      'time'
    ]
  };

  const items: AnomalousVolumeItem[] = [
    {
      id: '1',
      eventType: 'anomaly',
      ticker: 'VTBR',
      instrument: 'ВТБ',
      direction: 'sell',
      lots: 20,
      moneyVolume: 300,
      changePercent: -0.4,
      buyPercent: 30,
      sellPercent: 70,
      date: '01.01.2026',
      time: '10:00:00',
      detectedAt: 1000,
      sigmaScore: 1
    },
    {
      id: '2',
      eventType: 'anomaly',
      ticker: 'SBER',
      instrument: 'Сбербанк',
      direction: 'buy',
      lots: 10,
      moneyVolume: 100,
      changePercent: 0.2,
      buyPercent: 80,
      sellPercent: 20,
      date: '01.01.2026',
      time: '10:01:00',
      detectedAt: 3000,
      sigmaScore: 3
    },
    {
      id: '3',
      eventType: 'anomaly',
      ticker: 'GAZP',
      instrument: 'Газпром',
      direction: 'buy',
      lots: 30,
      moneyVolume: 200,
      changePercent: 1.1,
      buyPercent: 60,
      sellPercent: 40,
      date: '01.01.2026',
      time: '10:00:30',
      detectedAt: 2000,
      sigmaScore: 2
    }
  ];

  beforeEach(async () => {
    TestBed.overrideComponent(AnomalousVolumeComponent, {
      remove: {
        imports: [InfiniteScrollTableComponent]
      },
      add: {
        imports: [InfiniteScrollTableMockComponent]
      }
    });

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        AnomalousVolumeComponent
      ],
      providers: [
        {
          provide: AnomalousVolumeService,
          useValue: {
            watch: jasmine.createSpy('watch').and.returnValue(of(items))
          }
        },
        {
          provide: NzContextMenuService,
          useValue: {
            create: jasmine.createSpy('create')
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        provideMockStore()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AnomalousVolumeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('settings', settings);
    fixture.detectChanges();
  });

  it('должен показывать по умолчанию самое свежее уведомление сверху', () => {
    const data = component.tableData$.value;
    expect(data.map(x => x.detectedAt)).toEqual([3000, 2000, 1000]);
  });

  it('должен корректно сортировать все sortable-колонки', () => {
    const checks: { column: string, read: (x: AnomalousVolumeItem) => string | number }[] = [
      { column: 'eventType', read: x => x.eventType },
      { column: 'ticker', read: x => x.ticker },
      { column: 'instrument', read: x => x.instrument },
      { column: 'lots', read: x => x.lots },
      { column: 'moneyVolume', read: x => x.moneyVolume },
      { column: 'changePercent', read: x => x.changePercent },
      { column: 'buyPercent', read: x => x.buyPercent },
      { column: 'sellPercent', read: x => x.sellPercent },
      { column: 'date', read: x => x.detectedAt },
      { column: 'time', read: x => x.detectedAt }
    ];

    for (const check of checks) {
      (component as any).updateSorting(check.column, 'ascend');
      const asc = component.tableData$.value.map(check.read);
      expect(thisIsSorted(asc, true)).withContext(`asc sort failed: ${check.column}`).toBeTrue();

      (component as any).updateSorting(check.column, 'descend');
      const desc = component.tableData$.value.map(check.read);
      expect(thisIsSorted(desc, false)).withContext(`desc sort failed: ${check.column}`).toBeTrue();
    }
  });
});
