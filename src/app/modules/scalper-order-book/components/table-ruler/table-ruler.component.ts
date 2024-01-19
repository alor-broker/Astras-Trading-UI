import {
  AfterViewInit,
  Component, DestroyRef,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  SkipSelf,
  ViewChildren
} from '@angular/core';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  Observable,
  Subject,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { PriceUnits } from '../../models/scalper-order-book-settings.model';
import {
  SCALPER_ORDERBOOK_BODY_REF,
  ScalperOrderBookBodyRef
} from '../scalper-order-book-body/scalper-order-book-body.component';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { OrderbookDataRow } from "../../../orderbook/models/orderbook-data.model";

interface MarkerDisplay {
  index: number;
  points: number;
  percents: number;
}

@Component({
  selector: 'ats-table-ruler',
  templateUrl: './table-ruler.component.html',
  styleUrls: ['./table-ruler.component.less']
})
export class TableRulerComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('marker')
  markerElRef!: QueryList<ElementRef<HTMLElement>>;
  readonly priceUnits = PriceUnits;
  @Input({required: true})
  xAxisStep!: number;
  @Input({required: true})
  dataContext!: ScalperOrderBookDataContext;
  displayMarker$!: Observable<MarkerDisplay | null>;
  markerPosition$ = new BehaviorSubject<'left' | 'right'>('left');
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  private readonly activeRow$ = new Subject<{ price: number } | null>();

  constructor(
    @Inject(SCALPER_ORDERBOOK_BODY_REF)
    @SkipSelf()
    private readonly bodyRef: ScalperOrderBookBodyRef,
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly destroyRef: DestroyRef
  ) {
  }

  @Input()
  set activeRow(value: { price: number } | null) {
    this.activeRow$.next(value);
  }

  ngAfterViewInit(): void {
    this.markerElRef.changes.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const containerBounds = this.bodyRef.getElement().nativeElement.getBoundingClientRect();
      const elementBounds = this.elementRef.nativeElement.getBoundingClientRect();
      const markerBounds = x.first?.nativeElement?.getBoundingClientRect() as DOMRect | undefined;

      if (!markerBounds) {
        return;
      }

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
    this.settings$ = this.dataContext.extendedSettings$.pipe(
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
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$,
      this.dataContext.orderBook$,
      this.activeRow$,
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
