import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {
  combineLatest,
  filter,
  Observable,
  Subject
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { MarkerDisplayFormat } from '../../models/scalper-order-book-settings.model';

interface MarkerDisplay {
  index: number;
  points: number;
  percents: number;
}

@Component({
  selector: 'ats-table-ruler[xAxisStep][dataContext][activeRow]',
  templateUrl: './table-ruler.component.html',
  styleUrls: ['./table-ruler.component.less']
})
export class TableRulerComponent implements OnInit {
  readonly markerDisplayFormats = MarkerDisplayFormat;

  @Input()
  xAxisStep!: number;
  @Input()
  dataContext!: ScalperOrderBookDataContext;
  displayMarker$!: Observable<MarkerDisplay | null>;

  settings$!: Observable<ScalperOrderBookExtendedSettings>;

  private readonly activeRow$ = new Subject<{ price: number } | null>();

  @Input()
  set activeRow(value: { price: number } | null) {
    this.activeRow$.next(value);
  }

  ngOnInit(): void {
    this.settings$ = this.dataContext.extendedSettings$.pipe(
      map(x => {
        if(!!x.widgetSettings.rulerSettings) {
          return x;
        }

        return {
          ...x,
          widgetSettings: {
            ...x.widgetSettings,
            rulerSettings: {
              markerDisplayFormat: MarkerDisplayFormat.Points
            }
          }
        };
      })
    );

    this.displayMarker$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$,
      this.dataContext.orderBookData$,
      this.activeRow$,
      this.settings$
    ]).pipe(
      filter(([, displayRange, , ,]) => !!displayRange),
      map(([
             body,
             displayRange,
             orderBookData,
             activeRow,
             settings
           ]) => {
        if (!activeRow) {
          return null;
        }

        const displayRows = body.slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));
        const markerRowIndex = displayRows.findIndex(x => x.price === activeRow.price);

        if (markerRowIndex < 0) {
          return null;
        }

        const markerPrice = displayRows[markerRowIndex].price;
        const bestAsk = orderBookData.a[0];
        const bestBid = orderBookData.b[0];

        let bestPrice: number | null = null;
        if (bestAsk != null && markerPrice >= bestAsk.p) {
          bestPrice = bestAsk.p;
        }
        else if (bestBid != null && markerPrice <= bestBid.p) {
          bestPrice = bestBid.p;
        }

        if (bestPrice == null) {
          return null;
        }

        const points = Math.round(Math.abs(bestPrice - markerPrice) / settings.instrument.minstep);
        const percents = MathHelper.round((Math.abs(bestPrice - markerPrice) / markerPrice) * 100, 3);

        return {
          index: markerRowIndex,
          points,
          percents
        } as MarkerDisplay;
      })
    );
  }
}
