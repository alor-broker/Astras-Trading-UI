import { Component, DestroyRef, input, inject } from '@angular/core';
import {OptionBoardDataContext, OptionsSelection} from "../../models/option-board-data-context.model";
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
  timer,
} from "rxjs";
import {OptionKey, OptionSide} from "../../models/option-board.model";
import {debounceTime, map} from "rxjs/operators";
import {BaseColumnSettings} from "../../../../shared/models/settings/table-settings.model";
import {TranslatorFn, TranslatorService} from "../../../../shared/services/translator.service";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {defaultBadgeColor} from "../../../../shared/utils/instruments";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {ActionsContext} from 'src/app/shared/services/actions-context';
import {ACTIONS_CONTEXT} from "../../../../shared/services/actions-context";
import {BaseTableComponent} from "../../../../shared/components/base-table/base-table.component";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {OptionBoardDataContextFactory} from "../../utils/option-board-data-context-factory";
import {
  AddToWatchlistMenuComponent
} from "../../../instruments/widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
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
import {TableRowHeightDirective} from '../../../../shared/directives/table-row-height.directive';
import {NzPopconfirmDirective} from 'ng-zorro-antd/popconfirm';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {InputNumberComponent} from '../../../../shared/components/input-number/input-number.component';
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from 'ng-zorro-antd/descriptions';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {AsyncPipe, DecimalPipe, TitleCasePipe} from '@angular/common';

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
  templateUrl: './selected-options.component.html',
  styleUrls: ['./selected-options.component.less'],
  imports: [
    TranslocoDirective,
    NzResizeObserverDirective,
    NzEmptyComponent,
    LetDirective,
    NzTableComponent,
    TableRowHeightDirective,
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
    InputNumberComponent,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    NzPopoverDirective,
    AddToWatchlistMenuComponent,
    AsyncPipe,
    DecimalPipe,
    TitleCasePipe
  ]
})
export class SelectedOptionsComponent extends BaseTableComponent<DetailsDisplay> {
  private readonly optionBoardService = inject(OptionBoardService);
  private readonly translatorService = inject(TranslatorService);
  protected readonly widgetSettingsService: WidgetSettingsService;
  protected readonly actionsContext = inject<ActionsContext>(ACTIONS_CONTEXT);
  protected readonly nzContextMenuService = inject(NzContextMenuService);
  protected readonly destroyRef: DestroyRef;

  readonly dataContext = input.required<OptionBoardDataContext>();

  readonly minOptionTableWidth = 400;
  isLoading$ = new BehaviorSubject<boolean>(false);

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

  constructor() {
    const widgetSettingsService = inject(WidgetSettingsService);
    const destroyRef = inject(DestroyRef);

    super(widgetSettingsService, destroyRef);

    this.widgetSettingsService = widgetSettingsService;
    this.destroyRef = destroyRef;
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

  rowClick(optionKey: OptionKey, $event: Event): void {
    $event.preventDefault();
    $event.stopPropagation();

    this.dataContext().settings$.pipe(
      take(1)
    ).subscribe(settings => {
      if (settings.linkToActive === true) {
        this.widgetSettingsService.updateSettings(settings.guid, {linkToActive: false});
      }

      this.actionsContext.selectInstrument(
        {
          symbol: optionKey.symbol,
          exchange: optionKey.exchange
        },
        settings.badgeColor ?? defaultBadgeColor
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

  openContextMenu($event: MouseEvent, menu: AddToWatchlistMenuComponent, selectedRow: DetailsDisplay): void {
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
    const refreshTimer$ = timer(0, 60000).pipe(
      // for some reasons timer pipe is not completed in detailsDisplay$ when component destroyed (https://github.com/alor-broker/Astras-Trading-UI/issues/1176)
      // so we need to add takeUntil condition for this stream separately
      takeUntilDestroyed(this.destroyRef)
    );

    const selectionParameters$ = this.dataContext().selectionParameters$.pipe(
      debounceTime(2000)
    );

    return combineLatest({
      currentSelection: this.dataContext().currentSelection$,
      selectionParameters: selectionParameters$
    }).pipe(
      mapWith(() => refreshTimer$, source => source),
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
