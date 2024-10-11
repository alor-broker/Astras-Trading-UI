import {
  Component,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  SkipSelf
} from '@angular/core';
import {
  ClusterItem,
  TradesCluster
} from '../../models/trades-clusters.model';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  Observable,
  of
} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import { map } from 'rxjs/operators';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';
import {
  RULER_CONTEX,
  RulerContext
} from "../scalper-order-book-body/scalper-order-book-body.component";

interface DisplayItem {
  volume: number | null;
  isMaxVolume: boolean;
  isMajorLinePrice: boolean;
  isMinorLinePrice: boolean;
  mappedPrice: number;
}

@Component({
  selector: 'ats-trades-cluster',
  templateUrl: './trades-cluster.component.html',
  styleUrls: ['./trades-cluster.component.less']
})
export class TradesClusterComponent implements OnInit, OnDestroy {
  readonly numberFormats = NumberDisplayFormat;

  @Input({ required: true })
  xAxisStep!: number;

  @Input({ required: true })
  dataContext!: ScalperOrderBookDataContext;

  displayItems$!: Observable<(DisplayItem)[]>;
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  private readonly currentCluster$ = new BehaviorSubject<TradesCluster | null>(null);
  hoveredPriceRow$: Observable<{ price: number } | null> = this.rulerContext?.hoveredRow$ ?? of(null);

  constructor(
    @Inject(RULER_CONTEX)
    @SkipSelf()
    @Optional()
    private readonly rulerContext?: RulerContext) {
  }

  @Input()
  set cluster(value: TradesCluster) {
    this.currentCluster$.next(value);
  }

  ngOnDestroy(): void {
    this.currentCluster$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.dataContext.extendedSettings$;

    this.displayItems$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.displayRange$,
      this.currentCluster$
    ]).pipe(
      filter(([, displayRange]) => !!displayRange),
      map(([body, displayRange, currentCluster]) => {
        const displayRows = body.slice(displayRange!.start, Math.min(displayRange!.end + 1, body.length));

        const getVolume = (item: ClusterItem): number => {
          return Math.round(item.buyQty + item.sellQty);
        };

        let maxVolume = 0;
        const mappedRows = displayRows.map(r => {
          const displayRow = {
            volume: null,
            isMaxVolume: false,
            isMajorLinePrice: r.isMajorLinePrice,
            isMinorLinePrice: r.isMinorLinePrice,
            mappedPrice: r.price
          };

          if (!currentCluster) {
            return displayRow;
          }

          const mappedItems = currentCluster.tradeClusters.filter(c => c.price >= r.baseRange.min && c.price <= r.baseRange.max);
          if (mappedItems.length === 0) {
            return displayRow;
          }

          const itemVolume = mappedItems.reduce((total, curr) => Math.round(total + getVolume(curr)), 0);
          maxVolume = Math.max(maxVolume, itemVolume);

          return {
            ...displayRow,
            volume: itemVolume
          };
        });

        mappedRows.forEach(r => {
          if (r !== null) {
            r.isMaxVolume = r.volume === maxVolume;
          }
        });

        return mappedRows;
      })
    );
  }

  trackBy(index: number): number {
    return index;
  }

  isRulerHovered(item: DisplayItem, hoveredPriceRow: { price: number } | null): boolean {
    return item.mappedPrice === hoveredPriceRow?.price;
  }
}
