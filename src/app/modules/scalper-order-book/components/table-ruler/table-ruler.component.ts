import { AfterViewInit, Component, DestroyRef, ElementRef, input, OnDestroy, OnInit, viewChildren, inject } from '@angular/core';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {BehaviorSubject, combineLatest, filter, Observable,} from 'rxjs';
import {map} from 'rxjs/operators';
import {MathHelper} from '../../../../shared/utils/math-helper';
import {PriceUnits} from '../../models/scalper-order-book-settings.model';
import {
  SCALPER_ORDERBOOK_BODY_REF,
  ScalperOrderBookBodyRef
} from '../scalper-order-book-body/scalper-order-book-body.component';
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {OrderbookDataRow} from "../../../orderbook/models/orderbook-data.model";
import {AsyncPipe, NgClass, NgStyle} from '@angular/common';

interface MarkerDisplay {
  index: number;
  points: number;
  percents: number;
}

@Component({
  selector: 'ats-table-ruler',
  templateUrl: './table-ruler.component.html',
  styleUrls: ['./table-ruler.component.less'],
  imports: [
    NgClass,
    NgStyle,
    AsyncPipe
  ]
})
export class TableRulerComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly bodyRef = inject<ScalperOrderBookBodyRef>(SCALPER_ORDERBOOK_BODY_REF, { skipSelf: true });
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly markerElRef = viewChildren<ElementRef<HTMLElement>>('marker');
  readonly priceUnits = PriceUnits;
  readonly xAxisStep = input.required<number>();
  readonly dataContext = input.required<ScalperOrderBookDataContext>();
  displayMarker$!: Observable<MarkerDisplay | null>;
  markerPosition$ = new BehaviorSubject<'left' | 'right'>('left');
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  readonly activeRow = input<{ price: number } | null>(null);
  private readonly markerElRefChanges$ = toObservable(this.markerElRef);
  private readonly activeRowChanges$ = toObservable(this.activeRow);

  ngAfterViewInit(): void {
    this.markerElRefChanges$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const markerBounds = x[0]?.nativeElement?.getBoundingClientRect() as DOMRect | undefined;
      if (!markerBounds) {
        return;
      }

      const containerBounds = this.bodyRef.getElement().nativeElement.getBoundingClientRect();
      const elementBounds = this.elementRef.nativeElement.getBoundingClientRect();

      const leftSpace = elementBounds.x - containerBounds.x;

      this.markerPosition$.next(
        leftSpace > markerBounds.width + 5
          ? 'left'
          : 'right'
      );
    });
  }

  ngOnDestroy(): void {
    this.markerPosition$.complete();
  }

  ngOnInit(): void {
    this.initMarkerData();
  }

  private initMarkerData(): void {
    this.settings$ = this.dataContext().extendedSettings$.pipe(
      map(x => {
        if (!!x.widgetSettings.rulerSettings) {
          return x;
        }

        return {
          ...x,
          widgetSettings: {
            ...x.widgetSettings,
            rulerSettings: {
              markerDisplayFormat: PriceUnits.Points
            }
          }
        };
      })
    );

    this.displayMarker$ = combineLatest([
      this.dataContext().orderBookBody$,
      this.dataContext().displayRange$,
      this.dataContext().orderBook$,
      this.activeRowChanges$,
      this.settings$
    ]).pipe(
      filter(([, displayRange, , ,]) => !!displayRange),
      map(([
             body,
             displayRange,
             orderBook,
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
        const bestAsk = orderBook.rows.a[0] as OrderbookDataRow | undefined;
        const bestBid = orderBook.rows.b[0] as OrderbookDataRow | undefined;

        let bestPrice: number | null = null;
        if (bestAsk != null && markerPrice >= bestAsk.p) {
          bestPrice = bestAsk.p;
        } else if (bestBid != null && markerPrice <= bestBid.p) {
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
