import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import { TradesCluster } from '../../models/trades-clusters.model';
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
  displayItems$!: Observable<({ volume: number } | null)[]>;
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

        return displayRows.map(r => {
          if (!currentCluster) {
            return null;
          }

          const mappedItem = currentCluster.tradeClusters.find(x => x.price === r.price);
          if (!mappedItem) {
            return null;
          }

          return {
            volume: mappedItem.buyQty + mappedItem.sellQty
          };
        });
      })
    );
  }

  trackBy(index: number): number {
    return index;
  }
}
