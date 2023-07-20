import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, QueryList, ViewChildren} from '@angular/core';
import {OptionBoardDataContext} from "../../models/option-board-data-context.model";
import {OptionBoardService} from "../../services/option-board.service";
import {BehaviorSubject, combineLatest, forkJoin, Observable, of, shareReplay, switchMap, take, tap, timer} from "rxjs";
import {OptionKey, OptionSide} from "../../models/option-board.model";
import {filter, map, startWith} from "rxjs/operators";
import {BaseColumnSettings} from "../../../../shared/models/settings/table-settings.model";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";

interface DetailsDisplay extends OptionKey {
  underlyingAssetSymbol: string;
  description: string;
  expirationDate: Date;
  strikePrice: number;
  optionSide: OptionSide;
  optionType: string;
  doesImplyVolatility: boolean;
  underlyintPrice: number;
  fixedSpotDiscount: number;
  projectedSpotDiscount: number;
  ask: number;
  bid: number;
  volatility: number;
  price: number;
  delta: number
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

@Component({
  selector: 'ats-selected-options',
  templateUrl: './selected-options.component.html',
  styleUrls: ['./selected-options.component.less']
})
export class SelectedOptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren('tableContainer')
  tableQuery!: QueryList<ElementRef<HTMLElement>>;

  @Input({required: true})
  dataContext!: OptionBoardDataContext;
  readonly isLoading$ = new BehaviorSubject(false);
  detailsDisplay$!: Observable<DetailsDisplay[]>;
  displayColumns$!: Observable<BaseColumnSettings<DetailsDisplay>[]>;

  public tableScroll$?: Observable<ContentSize>;
  private readonly contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private readonly columnsConfig: BaseColumnSettings<DetailsDisplay>[] = [
    {
      id: 'symbol',
      displayName: 'symbol',
      width: 150,
      leftFixed: true
    },
    {
      id: 'underlyingAssetSymbol',
      displayName: 'underlyingAssetSymbol',
      width: 100
    },
    {
      id: 'optionSide',
      displayName: 'optionSide',
      width: 75
    },
    {
      id: 'optionType',
      displayName: 'optionType',
      width: 75
    },
    {
      id: 'strikePrice',
      displayName: 'strikePrice',
      width: 75
    },
    {
      id: 'expirationDate',
      displayName: 'expirationDate',
      width: 100
    },
    {
      id: 'ask',
      displayName: 'ask',
      width: 75
    },
    {
      id: 'bid',
      displayName: 'bid',
      width: 75
    },
    {
      id: 'price',
      displayName: 'price',
      width: 75
    },
    {
      id: 'delta',
      displayName: 'delta',
      width: 75
    },
    {
      id: 'gamma',
      displayName: 'gamma',
      width: 75
    },
    {
      id: 'vega',
      displayName: 'vega',
      width: 75
    },
    {
      id: 'theta',
      displayName: 'theta',
      width: 75
    },
    {
      id: 'rho',
      displayName: 'rho',
      width: 75
    },
  ];

  constructor(
    private readonly optionBoardService: OptionBoardService,
    private readonly translatorService: TranslatorService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
  ) {
  }

  ngOnInit(): void {
    this.initDetailsDisplay();
    this.initColumns();
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
  }

  formatExpirationDate(date: Date): string {
    return date.toLocaleDateString();
  }

  unselectOption($event: Event, option: DetailsDisplay) {
    $event.preventDefault();
    $event.stopPropagation();

    this.dataContext.removeItemFromSelection(option.symbol);
  }

  clearSelection() {
    this.dataContext.clearCurrentSelection();
  }

  updateContainerSize(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngAfterViewInit(): void {
    const tableRef$ = this.tableQuery.changes.pipe(
      map(x => x.first),
      startWith(this.tableQuery.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    this.tableScroll$ = combineLatest([
      this.contentSize$,
      tableRef$
    ]).pipe(
      filter(([contentSize,]) => !!contentSize),
      map(([contentSize, tableRef]) => {
        const tableHeader = tableRef.nativeElement.querySelector('.ant-table-thead');
        const scrollHeight = Math.floor(contentSize!.height - (tableHeader?.clientHeight ?? 0));

        return {
          height: scrollHeight,
          width: contentSize!.width
        };
      }),
      shareReplay(1)
    );
  }

  selectOption($event: Event, optionKey: OptionKey) {
    $event.preventDefault();
    $event.stopPropagation();

    this.dataContext.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.linkToActive === true) {
        this.widgetSettingsService.updateSettings(settings.guid, {linkToActive: false});
      }

      this.dashboardContextService.selectDashboardInstrument(
        {
          symbol: optionKey.symbol,
          exchange: optionKey.exchange
        },
        defaultBadgeColor
      );
    });
  }

  private initDetailsDisplay() {
    this.detailsDisplay$ = this.dataContext.currentSelection$.pipe(
      mapWith(() => timer(0, 60000), source => source),
      tap(() => this.isLoading$.next(true)),
      switchMap(selection => {
        if (!selection || selection.selectedOptions.length === 0) {
          return of([]);
        }

        const requests = selection.selectedOptions.map(o => {
          return this.optionBoardService.getOptionDetails(o.symbol, o.exchange).pipe(
            take(1),
            map(details => {
              if (!details) {
                return null;
              }

              return {
                instrument: selection.instrument,
                details
              };
            })
          );
        });


        return forkJoin(requests);
      }),
      map(x => x.filter(i => !!i)),
      map(x => x.map(i => {
          if (!i) {
            return null;
          }

          return {
            ...i.details,
            ...i.details.calculations,
            underlyingAssetSymbol: i.instrument.symbol,
            price: MathHelper.roundPrice(i.details.calculations.price, i.instrument.minStep)
          } as DetailsDisplay;
        })
      ),
      map(x => x.filter((i): i is DetailsDisplay => !!i)),
      tap(() => this.isLoading$.next(false)),
      shareReplay(1)
    );
  }

  private initColumns() {
    this.displayColumns$ = this.translatorService.getTranslator('option-board/selected-options').pipe(
      map(t => this.columnsConfig.map(c => this.toDisplayColumn(c, t))),
      shareReplay(1)
    );
  }

  private toDisplayColumn(columnConfig: BaseColumnSettings<DetailsDisplay>, translator: TranslatorFn): BaseColumnSettings<DetailsDisplay> {
    return {
      ...columnConfig,
      displayName: translator(['columns', columnConfig.id, 'name'], {fallback: columnConfig.displayName}),
      tooltip: translator(['columns', columnConfig.id, 'tooltip'], {fallback: columnConfig.tooltip}),
    };
  }
}
