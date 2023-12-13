import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  ClusterItem,
  TradesCluster
} from '../../models/trades-clusters.model';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  Observable
} from 'rxjs';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import { map } from 'rxjs/operators';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';


@Component({
  selector: 'ats-trades-cluster',
  templateUrl: './trades-cluster.component.html',
  styleUrls: ['./trades-cluster.component.less']
})
export class TradesClusterComponent implements OnInit, OnDestroy {
  readonly numberFormats = NumberDisplayFormat;

  @Input({required: true})
  xAxisStep!: number;
  @Input({required: true})
  dataContext!: ScalperOrderBookDataContext;
  displayItems$!: Observable<({ volume: number, isMaxVolume: boolean } | null)[]>;
  settings$!: Observable<ScalperOrderBookExtendedSettings>;
  private readonly currentCluster$ = new BehaviorSubject<TradesCluster | null>(null);

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

        const maxVolume = !!currentCluster && currentCluster.tradeClusters.length > 0
          ? Math.max(...currentCluster.tradeClusters.map(c => getVolume(c)))
          : null;

        return displayRows.map(r => {
          if (!currentCluster) {
            return null;
          }

          const mappedItem = currentCluster.tradeClusters.find(x => x.price === r.price);
          if (!mappedItem) {
            return null;
          }

          const itemVolume  = getVolume(mappedItem);

          return {
            volume: itemVolume,
            isMaxVolume: itemVolume === maxVolume
          };
        });
      })
    );
  }

  trackBy(index: number): number {
    return index;
  }
}
