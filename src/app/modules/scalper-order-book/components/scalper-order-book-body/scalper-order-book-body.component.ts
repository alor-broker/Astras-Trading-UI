import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { Destroyable } from '../../../../shared/utils/destroyable';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  interval,
  NEVER,
  Observable,
  shareReplay,
  take,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { PriceRowsStore } from '../../utils/price-rows-store';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { OrderbookData } from '../../../orderbook/models/orderbook-data.model';
import {
  map,
  switchMap
} from 'rxjs/operators';
import { ContentSize } from '../../../../shared/models/dashboard/dashboard-item.model';
import { ListRange } from '@angular/cdk/collections';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../../models/scalper-order-book-data-context.model';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScalperOrderBookCommands } from '../../models/scalper-order-book-commands';
import { ScalperOrderBookRowType } from '../../models/scalper-order-book.model';
import { ScalperOrderBookTableHelper } from '../../utils/scalper-order-book-table.helper';

@Component({
  selector: 'ats-scalper-order-book-body[guid][isActive][workingVolume]',
  templateUrl: './scalper-order-book-body.component.html',
  styleUrls: ['./scalper-order-book-body.component.less'],
  providers: [PriceRowsStore]
})
export class ScalperOrderBookBodyComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly rowHeight = 18;

  @ViewChild(CdkVirtualScrollViewport)
  scrollContainer!: CdkVirtualScrollViewport;
  @Input()
  guid!: string;
  @Input()
  isActive: boolean = false;
  readonly isLoading$ = new BehaviorSubject(false);
  dataContext!: ScalperOrderBookDataContext;
  hiddenOrdersIndicators$!: Observable<{ up: boolean, down: boolean }>;
  private readonly renderItemsRange$ = new BehaviorSubject<ListRange | null>(null);
  private readonly destroyable = new Destroyable();
  private readonly contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private readonly workingVolume$ = new BehaviorSubject<number | null>(null);

  constructor(
    private readonly scalperOrderBookDataContextService: ScalperOrderBookDataContextService,
    private readonly priceRowsStore: PriceRowsStore,
    private readonly quotesService: QuotesService,
    private readonly hotkeysService: HotKeyCommandService) {
  }

  @Input()
  set workingVolume(value: number) {
    this.workingVolume$.next(value);
  }

  updateContentSize(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnInit(): void {
    this.initContext();
    this.initAutoAlign();
    this.subscribeToHotkeys();
    this.initHiddenOrdersIndicators();
  }

  ngAfterViewInit(): void {
    this.scrollContainer.renderedRangeStream.pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(x => this.renderItemsRange$.next({
        start: x.start,
        end: x.end > 0 ? x.end - 1 : x.end
      })
    );

    this.initRowsFillingByHeight();
    this.initTableScrolling();
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();

    this.contentSize$.complete();
    this.isLoading$.complete();
    this.renderItemsRange$.complete();
    this.workingVolume$.complete();
  }

  private subscribeToHotkeys() {
    this.hotkeysService.commands$.pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(command => {
      if (command.type === ScalperOrderBookCommands.centerOrderBook) {
        this.alignTable();
      }
    });
  }

  private initAutoAlign() {
    this.dataContext.extendedSettings$.pipe(
      map(x => x.widgetSettings),
      map(x => ({
          enabled: (x.enableAutoAlign ?? true) && !!x.autoAlignIntervalSec && x.autoAlignIntervalSec > 0,
          interval: x.autoAlignIntervalSec!
        })
      ),
      switchMap(s => s.enabled ? interval(s.interval * 1000) : NEVER),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(() => {
      this.alignTable();
    });
  }

  private initHiddenOrdersIndicators() {
    this.hiddenOrdersIndicators$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.currentOrders$,
      this.dataContext.displayRange$
    ]).pipe(
      map(([orderBookBody, currentOrders,]) => {
        const topOffset = this.scrollContainer.measureScrollOffset('top');
        const bottomOffset = topOffset + this.scrollContainer.getViewportSize();

        const topVisibleIndex = Math.ceil(topOffset / this.rowHeight);
        const bottomVisibleIndex = Math.round(bottomOffset / this.rowHeight) - 1;

        const upPrice = topVisibleIndex < orderBookBody.bodyRows.length
          ? orderBookBody.bodyRows[topVisibleIndex]?.price
          : null;
        const downPrice = bottomVisibleIndex >= 0 && bottomVisibleIndex < orderBookBody.bodyRows.length
          ? orderBookBody.bodyRows[bottomVisibleIndex]?.price
          : null;

        return {
          up: !!upPrice && !!currentOrders.find(o => o.linkedPrice > upPrice),
          down: !!downPrice && !!currentOrders.find(o => o.linkedPrice < downPrice),
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private initContext() {
    const context = this.scalperOrderBookDataContextService.createContext(
      this.guid,
      this.priceRowsStore.rows$,
      (orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) => this.regeneratePriceRows(orderBookData, settings)
    );

    this.dataContext = {
      ...context,
      displayRange$: this.renderItemsRange$.asObservable(),
      workingVolume$: this.workingVolume$.asObservable()
        .pipe(
          filter(x => !!x),
          map(x => x!)
        )
    };
  }

  private initRowsFillingByHeight() {
    const getLastPrice = (instrumentKey: InstrumentKey) => this.quotesService.getLastPrice(instrumentKey).pipe(
      filter((lastPrice): lastPrice is number => !!lastPrice),
    );

    this.dataContext?.extendedSettings$.pipe(
      tap(() => this.isLoading$.next(true)),
      mapWith(
        settings => getLastPrice(settings.widgetSettings),
        (settings, lastPrice) => ({ settings, lastPrice })
      ),
      mapWith(
        () => this.contentSize$,
        (source,) => source
      ),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(x => {
      const displayRowsCount = Math.ceil((this.getContainerHeight() * 2 / this.rowHeight));

      this.priceRowsStore.initWithPriceRange(
        {
          min: x.lastPrice,
          max: x.lastPrice
        },
        x.settings.instrument.minstep,
        displayRowsCount,
        () => {
          this.scrollContainer.checkViewportSize();
          this.alignTable();
          this.isLoading$.next(false);
        }
      );
    });
  }

  private regeneratePriceRows(orderBookData: OrderbookData, settings: ScalperOrderBookExtendedSettings) {
    const bounds = this.scalperOrderBookDataContextService.getOrderBookBounds(orderBookData);
    const expectedMaxPrice = bounds.asksRange?.max ?? bounds.bidsRange?.max;
    const expectedMinPrice = bounds.bidsRange?.min ?? bounds.asksRange?.min;

    if (!expectedMaxPrice || !expectedMinPrice) {
      return;
    }

    const displayRowsCount = Math.ceil((this.getContainerHeight() * 2 / this.rowHeight));
    this.priceRowsStore.initWithPriceRange(
      {
        min: expectedMinPrice,
        max: expectedMaxPrice
      },
      settings.instrument.minstep,
      displayRowsCount,
      () => {
        this.scrollContainer.checkViewportSize();
        this.alignTable();
      }
    );
  }

  private getContainerHeight() {
    return this.scrollContainer.measureViewportSize('vertical');
  }

  private alignTable() {
    setTimeout(() => {
      this.dataContext.orderBookBody$.pipe(
        take(1)
      ).subscribe(orderBookBody => {
        let targetIndex: number | null = null;

        const spreadRows = orderBookBody.bodyRows.filter(r => r.rowType === ScalperOrderBookRowType.Spread);
        if (spreadRows.length > 0) {
          targetIndex = orderBookBody.bodyRows.indexOf(spreadRows[0]) + Math.round(spreadRows.length / 2);
        }
        else {
          const bestSellRowIndex = orderBookBody.bodyRows.findIndex(r => r.rowType === ScalperOrderBookRowType.Ask && r.isBest);
          if (bestSellRowIndex >= 0) {
            targetIndex = bestSellRowIndex;
          }
          else {
            const startRowIndex = orderBookBody.bodyRows.findIndex(r => r.isStartRow);
            if (startRowIndex >= 0) {
              targetIndex = startRowIndex;
            }
          }
        }

        setTimeout(() => {
          if (!!targetIndex) {
            const viewPortSize = this.getContainerHeight();
            const visibleItemsCount = viewPortSize / this.rowHeight;
            const centerCorrection = Math.floor(visibleItemsCount / 2) - 1;

            this.scrollContainer.scrollToIndex(targetIndex - centerCorrection);
          }
        });
      });
    });
  }

  private initTableScrolling() {
    this.scrollContainer.scrolledIndexChange.pipe(
      withLatestFrom(this.isLoading$),
      filter(([, isLoading]) => !isLoading),
      map(([index,]) => index),
      withLatestFrom(this.priceRowsStore.rows$),
      filter(([, priceRows]) => priceRows.length > 0),
      map(([index, priceRows]) => ({ index, priceRows })),
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(x => {
      const bufferItemsCount = 10;
      const topScrollOffset = this.scrollContainer.measureScrollOffset('top');
      const bottomScrollOffset = this.scrollContainer.measureScrollOffset('bottom');

      if ((topScrollOffset / this.rowHeight) < bufferItemsCount) {
        this.isLoading$.next(true);
        this.priceRowsStore.extendTop(bufferItemsCount, (addedItemsCount: number) => {
          ScalperOrderBookTableHelper.scrollTableToIndex(
            this.scrollContainer,
            this.rowHeight,
            x.index + addedItemsCount,
            false,
            false
          );
          this.isLoading$.next(false);
        });

        return;
      }

      if ((bottomScrollOffset / this.rowHeight) < bufferItemsCount) {
        this.isLoading$.next(true);
        this.priceRowsStore.extendBottom(bufferItemsCount, () => {
          this.isLoading$.next(false);
        });
      }
    });
  }
}
