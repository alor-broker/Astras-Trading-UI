import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { OptionBoardDataContext } from "../../models/option-board-data-context.model";
import { OptionBoardService } from "../../services/option-board.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { RecordContent } from "../../../../store/widgets-local-state/widgets-local-state.model";
import {
  InstrumentOptions,
  Option,
  OptionExpiration,
  OptionKey,
  OptionParameters,
  OptionSide,
  UnderlyingAsset
} from "../../models/option-board.model";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  Observable,
  pairwise,
  shareReplay,
  switchMap,
  take,
  tap,
  timer
} from "rxjs";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import { TranslocoDirective } from "@jsverse/transloco";
import { NzSpinComponent } from "ng-zorro-antd/spin";
import {
  AsyncPipe,
  DatePipe,
  NgTemplateOutlet
} from "@angular/common";
import { NzResizeObserverDirective } from "ng-zorro-antd/cdk/resize-observer";
import { ContentSize } from "../../../../shared/models/dashboard/dashboard-item.model";
import { LetDirective } from "@ngrx/component";
import { NzEmptyComponent } from "ng-zorro-antd/empty";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import {
  FormBuilder,
  FormsModule,
  Validators
} from "@angular/forms";
import { NzCollapseComponent } from "ng-zorro-antd/collapse";
import { dateDiffInDays } from "../../../../shared/utils/datetime";
import { MathHelper } from "../../../../shared/utils/math-helper";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { SharedModule } from "../../../../shared/shared.module";
import { InputNumberComponent } from "../../../../shared/components/input-number/input-number.component";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { compareAsc } from 'date-fns';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { mapWith } from "../../../../shared/utils/observable-helper";

interface CellLayout {
  displayParameter: OptionParameters;
  isEditable: boolean;
}

interface OptionsRowLayout extends RecordContent {
  callSideLayout: CellLayout[];
  putSideLayout: CellLayout[];
}

interface OptionQuotes {
  ask: number | null;
  prevAsk: number | null;
  bid: number | null;
  prevBid: number | null;
}

interface OptionDisplay {
  optionKey: OptionKey;
  parameters: {
    price: number;
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  };

  quotes$: Observable<OptionQuotes>;
}

interface StrikePriceGroup {
  strikePrice: number;
  put: OptionDisplay | null;
  call: OptionDisplay | null;
}

interface OptionsViewModel {
  underlyingAsset: UnderlyingAsset;
  strikes: StrikePriceGroup[];
}

interface ExpirationDisplay extends OptionExpiration {
  strikes$: Observable<OptionsViewModel | null>;
}

interface DisplaySettings extends RecordContent {
  strikesCount: number;
  highlightedSpreadItemsCount: number | null;
}

@Component({
    selector: 'ats-all-options-list-view',
    imports: [
        TranslocoDirective,
        NzSpinComponent,
        AsyncPipe,
        NgTemplateOutlet,
        NzResizeObserverDirective,
        LetDirective,
        NzEmptyComponent,
        NzSelectComponent,
        FormsModule,
        NzOptionComponent,
        NzCollapseComponent,
        DatePipe,
        SharedModule,
        InputNumberComponent
    ],
    templateUrl: './all-options-list-view.component.html',
    styleUrl: './all-options-list-view.component.less'
})
export class AllOptionsListViewComponent implements OnInit, OnDestroy {
  @Input({required: true})
  dataContext!: OptionBoardDataContext;

  @Input({required: true})
  guid!: string;

  protected readonly settingsValidationOptions = {
    highlightedSpreadItemsCount: {
      min: 0,
      max: inputNumberValidation.max
    }
  };

  protected activeLang$ = this.translatorService.getLangChanges();

  protected rowLayout$!: Observable<OptionsRowLayout>;

  protected parameterCellWidth$!: Observable<number>;

  protected readonly isLoading$ = new BehaviorSubject(false);

  protected readonly AvailableParameters: OptionParameters[] = [
    OptionParameters.Price,
    OptionParameters.Delta,
    OptionParameters.Gamma,
    OptionParameters.Vega,
    OptionParameters.Theta,
    OptionParameters.Rho
  ];

  protected readonly OptionParameters = OptionParameters;

  protected readonly OptionSide = OptionSide;

  protected currentPrice$!: Observable<number | null>;

  protected settingsForm = this.formBuilder.nonNullable.group({
    strikesCount: this.formBuilder.nonNullable.control(
      4,
      [Validators.required]
    ),
    highlightedSpreadItemsCount: this.formBuilder.nonNullable.control<number | null>(
      10,
      [
        Validators.min(this.settingsValidationOptions.highlightedSpreadItemsCount.min),
        Validators.max(this.settingsValidationOptions.highlightedSpreadItemsCount.max),
      ]
    )
  });

  protected selectedOptionKeys$!: Observable<Set<string>>;

  protected readonly availableValuesForStrikesCount = [4, 8, 12, 16, 20, 24];

  protected expirations$!: Observable<ExpirationDisplay[] | null>;

  protected readonly contentSize$ = new BehaviorSubject<ContentSize | null>(null);

  private readonly StorageKeys = {
    rowLayout: 'row-layout',
    displaySettings: 'display-settings'
  };

  constructor(
    private readonly optionBoardService: OptionBoardService,
    private readonly translatorService: TranslatorService,
    private readonly widgetLocalStateService: WidgetLocalStateService,
    private readonly quotesService: QuotesService,
    private readonly formBuilder: FormBuilder,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.contentSize$.complete();
  }

  ngOnInit(): void {
    this.initLayout();
    this.initDataStream();
    this.initCurrentPrice();
    this.initDisplaySettingsFormSaving();
  }

  protected updateOptionSelection(optionKey: OptionKey | null, underlyingAsset: UnderlyingAsset): void {
    if (optionKey == null) {
      return;
    }

    this.dataContext.updateOptionSelection(optionKey, underlyingAsset);
  }

  protected updateContentSize(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  protected changeCellLayout(side: OptionSide, parameterIndex: number, newValue: OptionParameters): void {
    this.rowLayout$.pipe(
      take(1)
    ).subscribe(layout => {
      const target = (side === OptionSide.Call
        ? layout.callSideLayout
        : layout.putSideLayout)
        [parameterIndex];

      if (target != null) {
        target.displayParameter = newValue;
        this.widgetLocalStateService.setStateRecord(
          this.guid,
          this.StorageKeys.rowLayout,
          layout
        );
      }
    });
  }

  protected getDaysToExpirations(expirationDate: Date): number {
    return dateDiffInDays(new Date(), expirationDate);
  }

  protected roundPrice(price: number, underlyingAsset: UnderlyingAsset): number {
    return MathHelper.roundPrice(price, underlyingAsset.minStep);
  }

  protected getCurrentPricePosition(
    rowIndex: number,
    allRows: StrikePriceGroup[],
    currentPrice: number | null,
    parentEl: HTMLElement
  ): number | null {
    if (allRows.length < 2 || currentPrice == null) {
      return null;
    }

    const nextPrice = rowIndex > 0
      ? allRows[rowIndex - 1]
      : allRows[rowIndex + 1];

    const row = allRows[rowIndex];
    const step = Math.abs(row.strikePrice - nextPrice.strikePrice);
    const topPrice = row.strikePrice - (step / 2);
    const bottomPrice = row.strikePrice + (step / 2);

    if (step === 0 || currentPrice > bottomPrice || currentPrice < topPrice) {
      return null;
    }

    const pxStep = parentEl.clientHeight / step;
    return Math.round((currentPrice - topPrice) * pxStep);
  }

  protected isOptionSelected(option: OptionKey | null, selectedOptionKeys: Set<string>): boolean {
    if (option == null) {
      return false;
    }

    return selectedOptionKeys.has(this.encodeToString(option));
  }

  protected isSpreadHighlighted(quotes: OptionQuotes, underlyingAsset: UnderlyingAsset): boolean {
    if (quotes.ask == null || quotes.bid == null) {
      return false;
    }

    if (this.settingsForm.controls.highlightedSpreadItemsCount.valid) {
      const spread = this.settingsForm.controls.highlightedSpreadItemsCount.value;
      if (spread != null && spread > 0) {
        return ((quotes.ask - quotes.bid) / underlyingAsset.minStep) > spread;
      }
    }

    return false;
  }

  private getOptionQuotes(option: Option): Observable<OptionQuotes> {
    return this.quotesService.getQuotes(
      option.symbol,
      option.exchange
    ).pipe(
      map(q => ({
        ask: q.ask,
        bid: q.bid
      })),
      startWith({
        ask: option.ask,
        bid: option.bid
      }),
      pairwise(),
      map(([prev, curr]) => {
        return {
          ask: curr.ask,
          prevAsk: prev.ask,
          bid: curr.bid,
          prevBid: prev.bid
        };
      }),
      startWith({
        ask: option.ask,
        prevAsk: option.ask,
        bid: option.bid,
        prevBid: option.bid
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private getOptionsForExpiration(expiration: OptionExpiration): Observable<OptionsViewModel | null> {
    return defer(() => {
      const refreshTimer$ = timer(0, 60000).pipe(
        takeUntilDestroyed(this.destroyRef)
      );

      const strikesCount$ = this.settingsForm.controls.strikesCount.valueChanges.pipe(
        startWith(this.settingsForm.controls.strikesCount.value),
        filter(() => this.settingsForm.controls.strikesCount.valid),
      );

      return strikesCount$.pipe(
        mapWith(() => refreshTimer$, (source,) => source),
        tap(() => this.isLoading$.next(true)),
        switchMap(strikesCount => this.optionBoardService.getOptionsByExpirationDate(
          expiration.symbol,
          expiration.exchange,
          expiration.expiration,
          strikesCount
        )),
        map(o => {
          if (o == null) {
            return null;
          }

          return this.prepareOptionsViewModel(o);
        }),
        tap(() => this.isLoading$.next(false))
      );
    });
  }

  private initLayout(): void {
    this.rowLayout$ = this.widgetLocalStateService.getStateRecord<OptionsRowLayout>(
      this.guid,
      this.StorageKeys.rowLayout
    ).pipe(
      map(record => {
        return record != null
          ? JSON.parse(JSON.stringify(record)) as OptionsRowLayout
          : this.getDefaultRowLayout();
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.parameterCellWidth$ = combineLatest({
      contentSize: this.contentSize$,
      rowLayout: this.rowLayout$
    }).pipe(
      filter(x => x.contentSize != null),
      map(x => {
        const cellsCount = x.rowLayout.putSideLayout.length
          + x.rowLayout.callSideLayout.length
          // cell for strike price
          + 1;

        return Math.max(
          (x.contentSize!.width) / cellsCount,
          55
        );
      })
    );
  }

  private initDataStream(): void {
    this.expirations$ = this.dataContext.settings$.pipe(
      tap(() => this.isLoading$.next(true)),
      switchMap(s => this.optionBoardService.getExpirations(s.symbol, s.exchange)),
      map(items => {
        if (items == null) {
          return items;
        }

        return items
          .sort((a, b) => compareAsc(a.expiration, b.expiration))
          .map(item => {
            return {
              ...item,
              strikes$: this.getOptionsForExpiration(item)
            };
          });
      }),
      tap(() => this.isLoading$.next(false)),
      shareReplay({bufferSize: 1, refCount: true})
    );

    this.selectedOptionKeys$ = this.dataContext.currentSelection$.pipe(
      map(selectedOptions => {
        return new Set(selectedOptions.selectedOptions.map(o => this.encodeToString(o)));
      })
    );
  }

  private prepareOptionsViewModel(options: InstrumentOptions): OptionsViewModel {
    const strikePriceGroups = new Map<number, Option[]>();

    options.options.forEach(option => {
      const strikePrice = option.strikePrice;
      const existing = strikePriceGroups.get(strikePrice);
      if (existing != null) {
        existing.push(option);
      } else {
        strikePriceGroups.set(strikePrice, [option]);
      }
    });

    const groupOptions = Array.from(strikePriceGroups.keys())
      .sort((a, b) => a - b)
      .map(price => {
        const items = strikePriceGroups.get(price)!;
        const put = items.find(i => i.optionSide === OptionSide.Put);
        const call = items.find(i => i.optionSide === OptionSide.Call);

        return {
          strikePrice: price,
          put: this.toOptionDisplay(put ?? null),
          call: this.toOptionDisplay(call ?? null)
        };
      });

    return {
      underlyingAsset: options.underlyingAsset,
      strikes: groupOptions
    };
  }

  private getDefaultRowLayout(): OptionsRowLayout {
    const getCallLayout = (): CellLayout[] => {
      return [
        {
          displayParameter: OptionParameters.Vega,
          isEditable: true
        },
        {
          displayParameter: OptionParameters.Delta,
          isEditable: true
        },
        {
          displayParameter: OptionParameters.Price,
          isEditable: true
        },
        {
          displayParameter: OptionParameters.Ask,
          isEditable: false
        },
        {
          displayParameter: OptionParameters.Bid,
          isEditable: false
        }
      ];
    };

    return {
      callSideLayout: getCallLayout(),
      putSideLayout: getCallLayout().reverse()
    };
  }

  private toOptionDisplay(option: Option | null): OptionDisplay | null {
    if (option == null) {
      return null;
    }

    return {
      optionKey: {
        symbol: option.symbol,
        exchange: option.exchange
      },
      parameters: {
        ...option.calculations
      },
      quotes$: this.getOptionQuotes(option)
    };
  }

  private initCurrentPrice(): void {
    this.currentPrice$ = this.dataContext.settings$.pipe(
      switchMap(settings => {
        return this.quotesService.getQuotes(settings.symbol, settings.exchange).pipe(
          map(quote => {
            if (quote == null) {
              return null;
            }

            return quote.last_price;
          }),
          startWith(null)
        );
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private encodeToString(optionKey: OptionKey): string {
    return `${optionKey.symbol}:${optionKey.exchange}`;
  }

  private initDisplaySettingsFormSaving(): void {
    this.widgetLocalStateService.getStateRecord<DisplaySettings>(this.guid, this.StorageKeys.displaySettings).pipe(
      take(1)
    ).subscribe(saved => {
      if (saved != null) {
        this.settingsForm.setValue({
          strikesCount: saved.strikesCount,
          highlightedSpreadItemsCount: saved.highlightedSpreadItemsCount
        });
      }

      this.settingsForm.valueChanges.pipe(
        filter(() => this.settingsForm.valid),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(settings => {
        this.widgetLocalStateService.setStateRecord<DisplaySettings>(
          this.guid,
          this.StorageKeys.displaySettings,
          {
            strikesCount: settings.strikesCount!,
            highlightedSpreadItemsCount: settings.highlightedSpreadItemsCount ?? null
          },
          true
        );
      });
    });
  }
}
