import {Component, Input, OnInit} from '@angular/core';
import {forkJoin, Observable, timer} from 'rxjs';
import {IndexDisplay} from '../../models/ribbon-display.model';
import {map, switchMap} from "rxjs/operators";
import {HistoryService} from "../../../../shared/services/history.service";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {getDayChangePerPrice} from "../../../../shared/utils/price";

@Component({
    selector: 'ats-ribbon',
    templateUrl: './ribbon.component.html',
    styleUrls: ['./ribbon.component.less'],
    standalone: false
})
export class RibbonComponent implements OnInit {
  @Input({required: true})
  guid!: string;

  indices$!: Observable<IndexDisplay[]>;
  private readonly displayIndices: { displayName: string, instrumentKey: InstrumentKey }[] = [
    {
      displayName: 'IMOEX',
      instrumentKey: {
        symbol: 'IMOEX',
        exchange: 'MOEX'
      }
    },
    {
      displayName: 'RTSI',
      instrumentKey: {
        symbol: 'RTSI',
        exchange: 'MOEX'
      }
    },
    {
      displayName: 'USD/РУБ',
      instrumentKey: {
        symbol: 'USD000UTSTOM',
        exchange: 'MOEX'
      }
    },
    {
      displayName: 'CNY/РУБ',
      instrumentKey: {
        symbol: 'CNYRUB_TOM',
        exchange: 'MOEX'
      }
    },
    {
      displayName: 'Oil (Brent)',
      instrumentKey: {
        symbol: this.getNextFuturesContract('BR'),
        exchange: 'MOEX'
      }
    },
    {
      displayName: 'Gold',
      instrumentKey: {
        symbol: this.getNextFuturesContract('GOLD'),
        exchange: 'MOEX'
      }
    }
  ];

  constructor(
    private readonly historyService: HistoryService
  ) {
  }

  ngOnInit(): void {
    this.indices$ = timer(0, 60000).pipe(
      switchMap(() => {
        const indices$ = this.displayIndices.map(i => {
          return this.getQuoteInfo(i.instrumentKey).pipe(
            map(x => ({
              name: i.displayName,
              value: x?.value ?? 0,
              changePercent: x?.percentChange ?? 0
            } as IndexDisplay))
          );
        });

        return forkJoin(indices$);
      })
    );
  }

  private getQuoteInfo(instrumentKey: InstrumentKey): Observable<{ value: number, percentChange: number } | null> {
    return this.historyService.getLastTwoCandles(instrumentKey).pipe(
      map(candles => {
        if (!candles) {
          return null;
        }

        return {
          value: candles.cur.close,
          percentChange: getDayChangePerPrice(candles.cur.close, candles.prev.close)
        };
      })
    );
  }

  private getNextFuturesContract(prefix: string): string {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    let nextMonth;
    let nextYear;

    if (currentMonth >= 1 && currentMonth < 3) {
      nextMonth = 3;
      nextYear = currentYear;
    } else if (currentMonth >= 3 && currentMonth < 6) {
      nextMonth = 6;
      nextYear = currentYear;
    } else if (currentMonth >= 6 && currentMonth < 9) {
      nextMonth = 9;
      nextYear = currentYear;
    } else if (currentMonth >= 9) {
      nextMonth = 12;
      nextYear = currentYear;
    } else {
      nextMonth = 3;
      nextYear = currentYear + 1;
    }

    return `${prefix}-${nextMonth}.${nextYear.toString().slice(2)}`;
  }
}
