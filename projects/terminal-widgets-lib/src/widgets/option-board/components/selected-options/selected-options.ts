import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {OptionBoardService} from "../../services/option-board.service";
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from "rxjs";
import {
  debounceTime,
  map
} from "rxjs/operators";
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {NzContextMenuService} from "ng-zorro-antd/dropdown";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {LetDirective} from '@ngrx/component';
import {
  NzCellFixedDirective,
  NzTableCellDirective,
  NzTableComponent,
  NzTableVirtualScrollDirective,
  NzTbodyComponent,
  NzTheadComponent,
  NzThMeasureDirective,
  NzTrDirective
} from 'ng-zorro-antd/table';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from 'ng-zorro-antd/descriptions';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {
  AsyncPipe,
  DecimalPipe,
  TitleCasePipe
} from '@angular/common';
import {
  OptionKey,
  OptionSide
} from '@terminal-widgets-lib/widgets/option-board/types/option-board.types';
import {BaseTableComponent} from '@terminal-core-lib/features/tables/components/base-table';
import {
  OptionBoardDataContext,
  OptionsSelection
} from '@terminal-widgets-lib/widgets/option-board/types/option-board-data-context.types';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {
  BaseColumnSettings,
  TableConfig
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {AddToWatchlistMenu} from '@terminal-core-lib/features/watchlist/components/add-to-watchlist-menu/add-to-watchlist-menu';
import {withRefresh} from '@terminal-core-lib/common/utils/observable/with-refresh';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {TranslatorFn} from '@terminal-core-lib/features/translations/services/translator-service.types';
import {TableRowHeight} from '@terminal-core-lib/common/directives/table-row-height';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

interface OptionTranscription {
  ticker: string;
  settlementType: string;
  expirationDate: string;
  optionType: string;
  expirationType: string;
  strikePrice: string;
}

interface DetailsDisplay extends OptionKey {
  optionTranscription?: OptionTranscription;
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
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
  quantity?: number | null;
}

@Component({
  selector: 'ats-selected-options',
  templateUrl: './selected-options.html',
  styleUrls: ['./selected-options.less'],
  imports: [
    TranslocoDirective,
    NzResizeObserverDirective,
    NzEmptyComponent,
    LetDirective,
    NzTableComponent,
    NzTheadComponent,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    NzCellFixedDirective,
    NzPopconfirmDirective,
    NzTooltipDirective,
    NzTbodyComponent,
    NzTableVirtualScrollDirective,
    NzIconDirective,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    NzPopoverDirective,
    AsyncPipe,
    DecimalPipe,
    TitleCasePipe,
    TableRowHeight,
    InputNumber,
    AddToWatchlistMenu
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class SelectedOptions extends BaseTableComponent<DetailsDisplay> {
  readonly dataContext = input.required<OptionBoardDataContext>();

  readonly minOptionTableWidth = 400;

  isLoading$ = new BehaviorSubject<boolean>(false);

  protected readonly actionsContext = inject(ACTIONS_CONTEXT);

  protected readonly nzContextMenuService = inject(NzContextMenuService);

  protected allColumns: BaseColumnSettings<DetailsDisplay>[] = [
    {
      id: 'symbol',
      displayName: 'symbol',
      width: 150,
      leftFixed: true
    },
    {
      id: 'quantity',
      displayName: 'quantity',
      width: 75
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

  private readonly optionBoardService = inject(OptionBoardService);

  private readonly translatorService = inject(TranslatorService);

  private readonly applicationStatusService = inject(ApplicationStatusService);

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.isLoading$.complete();
  }

  formatExpirationDate(date: Date): string {
    return date.toLocaleDateString();
  }

  unselectOption($event: Event, option: DetailsDisplay): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.dataContext().removeItemFromSelection(option.symbol);
  }

  clearSelection(): void {
    this.dataContext().clearCurrentSelection();
  }

  override rowClick(optionKey: OptionKey, $event: Event): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.dataContext().settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.linkToActive === true) {
        this.settingsService.updateSettings(settings.guid, {linkToActive: false});
      }

      this.actionsContext.selectInstrument(
        {
          symbol: optionKey.symbol,
          exchange: optionKey.exchange
        },
        settings.badgeColor ?? DefaultBadge
      );
    });
  }

  setSelectedOptionQuantity(option: DetailsDisplay, quantity: number | null): void {
    this.dataContext().currentSelection$.pipe(
      take(1)
    ).subscribe(selection => {
      const targetOption = selection.selectedOptions.find(x => x.symbol === option.symbol && x.exchange === option.exchange);
      if (targetOption != null) {
        this.dataContext().setParameters(targetOption, {quantity: quantity ?? 1});
      }
    });
  }

  openContextMenu($event: MouseEvent, menu: AddToWatchlistMenu, selectedRow: DetailsDisplay): void {
    const menuRef = menu.menuRef();
    if (menuRef == null) {
      $event.preventDefault();
      return;
    }

    this.nzContextMenuService.close(true);
    menu.itemToAdd.set(
      {
        symbol: selectedRow.symbol,
        exchange: selectedRow.exchange
      }
    );

    this.nzContextMenuService.create($event, menuRef);
  }

  protected initTableConfigStream(): Observable<TableConfig<DetailsDisplay>> {
    return this.translatorService.getTranslator('option-board/selected-options').pipe(
      map(t => ({columns: this.allColumns.map(c => this.toDisplayColumn(c, t))})),
      shareReplay(1)
    );
  }

  protected initTableDataStream(): Observable<DetailsDisplay[]> {
    const selectionParameters$ = this.dataContext().selectionParameters$.pipe(
      debounceTime(2000)
    );

    return combineLatest({
      currentSelection: this.dataContext().currentSelection$,
      selectionParameters: selectionParameters$
    }).pipe(
      withRefresh(60000, this.applicationStatusService.isActive$),
      tap(() => this.isLoading$.next(true)),
      switchMap(x => {
        if ((x.currentSelection as OptionsSelection | null)?.selectedOptions.length === 0) {
          return of([]);
        }

        const requests = x.currentSelection.selectedOptions.map(o => {
          return this.optionBoardService.getOptionDetails(o.symbol, o.exchange).pipe(
            take(1),
            map(details => {
              if (!details) {
                return null;
              }

              return {
                instrument: x.currentSelection.instrument,
                details,
                quantity: x.selectionParameters.get(OptionBoardDataContextFactory.getParametersKey(o))?.quantity ?? 1
              };
            })
          );
        });

        return forkJoin(requests);
      }),
      map(x => x.filter(i => !!i)),
      map(x => x.map(i => {
          if (i == null) {
            return null;
          }

          return {
            ...i.details,
            ...i.details.calculations,
            quantity: i.quantity,
            optionTranscription: this.getOptionTranscription(i.details.symbol, i.instrument.symbol),
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

  private getOptionTranscription(optionTicker: string, baseTicker: string): OptionTranscription {
    const optionTickerRegExp = new RegExp(`(${baseTicker})([PM])(\\d{6})([PC])([AE])(\\d+)`);
    const matchedParts = Array.from(optionTicker.match(optionTickerRegExp)!);
    matchedParts.shift();

    return {
      ticker: matchedParts[0],
      settlementType: matchedParts[1],
      expirationDate: matchedParts[2],
      optionType: matchedParts[3],
      expirationType: matchedParts[4],
      strikePrice: matchedParts[5],
    };
  }

  private toDisplayColumn(columnConfig: BaseColumnSettings<DetailsDisplay>, translator: TranslatorFn): BaseColumnSettings<DetailsDisplay> {
    return {
      ...columnConfig,
      displayName: translator(['columns', columnConfig.id, 'name'], {fallback: columnConfig.displayName}),
      tooltip: translator(['columns', columnConfig.id, 'tooltip'], {fallback: columnConfig.tooltip}),
    };
  }
}
