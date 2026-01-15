import { AfterViewInit, Component, DestroyRef, ElementRef, input, OnDestroy, OnInit, viewChildren, inject } from '@angular/core';
import {BehaviorSubject, combineLatest, Observable, shareReplay, switchMap, take, tap, timer} from "rxjs";
import {OptionBoardDataContext, OptionsSelection} from "../../models/option-board-data-context.model";
import {OptionBoardService} from "../../services/option-board.service";
import {InstrumentOptions, Option, OptionParameters, UnderlyingAsset} from "../../models/option-board.model";
import {filter, map} from "rxjs/operators";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {dateDiffInDays} from "../../../../shared/utils/datetime";
import {mapWith} from "../../../../shared/utils/observable-helper";
import {MathHelper} from "../../../../shared/utils/math-helper";
import {ContentSize} from "../../../../shared/models/dashboard/dashboard-item.model";
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from "@angular/cdk/scrolling";
import {takeUntilDestroyed, toObservable} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {AsyncPipe, DatePipe, DecimalPipe, NgStyle} from '@angular/common';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {OptionPreviewComponent} from '../option-preview/option-preview.component';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';

interface OptionDisplay extends Option {
  displayValue: string;
}

interface MatrixMeta {
  maxPriceIndexLength: number;
  maxDisplayParameterLength: number;
}

interface OptionsMatrix {
  priceIndex: number[];
  dateIndex: Date[];
  underlyingAsset?: UnderlyingAsset;
  options: (OptionDisplay | null) [][];
  meta?: MatrixMeta;
}

interface LayoutSizes {
  priceColumnWidth: number;
  optionCellWidth: number;
}

@Component({
  selector: 'ats-all-options',
  templateUrl: './all-options.component.html',
  styleUrls: ['./all-options.component.less'],
  imports: [
    TranslocoDirective,
    NzSpinComponent,
    NzEmptyComponent,
    NzResizeObserverDirective,
    NgStyle,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    NzPopoverDirective,
    NzTypographyComponent,
    OptionPreviewComponent,
    NzIconDirective,
    NzTooltipDirective,
    AsyncPipe,
    DecimalPipe,
    DatePipe
  ]
})
export class AllOptionsComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly optionBoardService = inject(OptionBoardService);
  private readonly translatorService = inject(TranslatorService);
  private readonly destroyRef = inject(DestroyRef);

  readonly rowHeight = 30;
  readonly isLoading$ = new BehaviorSubject(false);

  readonly dataContext = input.required<OptionBoardDataContext>();

  readonly bodyScrollContainerQuery = viewChildren<CdkVirtualScrollViewport>(CdkVirtualScrollViewport);
  readonly headerContainerQuery = viewChildren<ElementRef<HTMLElement>>('header');
  activeLang$!: Observable<string>;
  optionsMatrix$!: Observable<OptionsMatrix>;
  currentPriceYPosition$!: Observable<number | null>;
  readonly contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private readonly bodyScrollContainerQueryChanges$ = toObservable(this.bodyScrollContainerQuery);
  private readonly headerContainerQueryChanges$ = toObservable(this.headerContainerQuery);
  private bodyScroll$!: Observable<CdkVirtualScrollViewport>;
  private readonly defaultLayoutSizes: LayoutSizes = {
    priceColumnWidth: 50,
    optionCellWidth: 50
  };

  readonly layoutSizes$ = new BehaviorSubject<LayoutSizes>(this.defaultLayoutSizes);
  private readonly optionDisplayParameterMap = new Map<OptionParameters, (option: Option) => string>([
    [OptionParameters.Price, (option: Option): string => option.calculations.price.toString()],
    [OptionParameters.Delta, (option: Option): string => MathHelper.round(option.calculations.delta, 2).toString()],
    [OptionParameters.Gamma, (option: Option): string => MathHelper.round(option.calculations.gamma, 2).toString()],
    [OptionParameters.Vega, (option: Option): string => MathHelper.round(option.calculations.vega, 2).toString()],
    [OptionParameters.Theta, (option: Option): string => MathHelper.round(option.calculations.theta, 2).toString()],
    [OptionParameters.Rho, (option: Option): string => MathHelper.round(option.calculations.rho, 2).toString()],
    [OptionParameters.Ask, (option: Option): string => option.ask.toString()],
    [OptionParameters.Bid, (option: Option): string => option.bid.toString()]
  ]);

  ngAfterViewInit(): void {
    this.setBodyScrollContainer();
    this.initHorizontalScrollSync();
    this.initCurrentPriceYPosition();
  }

  ngOnInit(): void {
    this.activeLang$ = this.translatorService.getLangChanges();
    this.initMatrixStream();
    this.initLayoutRecalculation();
  }

  getDaysToExpirations(expirationDate: Date): number {
    return dateDiffInDays(new Date(), expirationDate);
  }

  updateContainerSize(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnDestroy(): void {
    this.contentSize$.complete();
    this.layoutSizes$.complete();
  }

  getPriceTrackKey(index: number, item: number): number {
    return item;
  }

  getDateTrackKey(index: number, item: Date): number {
    return item.getTime();
  }

  updateOptionSelection(option: OptionDisplay, underlyingAsset: UnderlyingAsset): void {
    this.dataContext().updateOptionSelection(option, underlyingAsset);
  }

  isOptionSelected(option: OptionDisplay, selectedOptions: OptionsSelection | null): boolean {
    if (!selectedOptions) {
      return false;
    }

    return !!selectedOptions.selectedOptions.find(x => option.symbol === x.symbol);
  }

  private initMatrixStream(): void {
    const afterRefreshActions: ((matrix: OptionsMatrix) => void)[] = [];

    const refreshTimer$ = timer(0, 60000).pipe(
      // for some reasons timer pipe is not completed in optionsMatrix$ when component destroyed (https://github.com/alor-broker/Astras-Trading-UI/issues/1176)
      // so we need to add takeUntil condition for this stream separately
      takeUntilDestroyed(this.destroyRef)
    );

    this.optionsMatrix$ = combineLatest([
      this.dataContext().settings$,
      this.dataContext().selectedSide$
    ]).pipe(
      tap(() => {
        afterRefreshActions.push((x) => this.scrollToPrice(x));
      }),
      mapWith(() => refreshTimer$, source => source),
      tap(() => this.isLoading$.next(true)),
      switchMap(([settings, optionSide]) =>
        this.optionBoardService.getInstrumentOptions(settings.symbol, settings.exchange, optionSide)
      ),
      mapWith(
        () => this.dataContext().selectedParameter$,
        (options, parameter) => ({options, parameter})
      ),
      tap(() => this.isLoading$.next(true)),
      map(({options, parameter}) => this.optionsToMatrix(options, parameter)),
      tap((x) => {
        for (const action of afterRefreshActions.reverse()) {
          action(x);
        }

        afterRefreshActions.length = 0;

        this.isLoading$.next(false);
      }),
      shareReplay(1)
    );
  }

  private initLayoutRecalculation(): void {
    combineLatest([
      this.optionsMatrix$,
      this.contentSize$
    ]).pipe(
      filter(([matrix, contentSize]) => matrix.dateIndex.length > 0 && !!matrix.meta && !!contentSize),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([matrix, contentSize]) => {
      const fullWidth = contentSize!.width;
      const symbolMultiplier = 8;

      const priceColumnWidth = Math.max(this.defaultLayoutSizes.priceColumnWidth, Math.floor(matrix.meta!.maxPriceIndexLength * symbolMultiplier));

      const scrollCorrection = 7;
      const fullWidthOptionCellWidth = Math.floor((fullWidth - priceColumnWidth - scrollCorrection) / matrix.dateIndex.length);
      const symbolsOptionCellWidth = Math.floor(matrix.meta!.maxDisplayParameterLength * symbolMultiplier);

      this.layoutSizes$.next({
        priceColumnWidth: priceColumnWidth,
        optionCellWidth: Math.max(this.defaultLayoutSizes.priceColumnWidth, fullWidthOptionCellWidth, symbolsOptionCellWidth)
      });
    });
  }

  private setBodyScrollContainer(): void {
    this.bodyScroll$ = this.bodyScrollContainerQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter((x): x is CdkVirtualScrollViewport => !!x),
      shareReplay(1)
    );
  }

  private initHorizontalScrollSync(): void {
    const header$ = this.headerContainerQueryChanges$.pipe(
      map(x => x.length > 0 ? x[0] : undefined),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      map(x => x.nativeElement),
      shareReplay(1)
    );

    this.bodyScroll$.pipe(
      mapWith(
        () => header$,
        (body, header) => ({body, header})
      ),
      mapWith(
        x => x.body.elementScrolled(),
        (source) => source),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      x.header.scrollLeft = x.body.measureScrollOffset('left');
    });
  }

  private initCurrentPriceYPosition(): void {
    const displayRange$ = this.bodyScroll$.pipe(
      switchMap(x => x.renderedRangeStream)
    );

    this.currentPriceYPosition$ = combineLatest([
      this.optionsMatrix$,
      displayRange$
    ]).pipe(
      map(([matrix, displayRange]) => {
        if (matrix.underlyingAsset?.lastPrice == null) {
          return null;
        }

        const priceIndexStart = displayRange.start;
        const priceIndexEnd = Math.min(displayRange!.end + 1, matrix.priceIndex.length);

        let prevPriceIndex: number | null = null;
        let nextPriceIndex: number | null = null;
        let positionIndex: number | null = null;

        const currentPrice = matrix.underlyingAsset.lastPrice;
        for (let i = priceIndexStart; i <= priceIndexEnd; i++) {
          const priceIndex = matrix.priceIndex[i];

          if (priceIndex <= currentPrice) {
            prevPriceIndex = priceIndex;
            positionIndex = i - priceIndexStart;
          }

          if (priceIndex >= currentPrice) {
            nextPriceIndex = priceIndex;
            break;
          }
        }

        if (!(prevPriceIndex ?? 0) || !(nextPriceIndex ?? 0) || !(positionIndex ?? 0)) {
          return null;
        }

        const priceDiff = nextPriceIndex! - prevPriceIndex!;
        const pricePerPixel = priceDiff > 0
          ? this.rowHeight / priceDiff
          : 1;

        const topOffset = (currentPrice - prevPriceIndex!) * pricePerPixel;
        return Math.floor((positionIndex! * this.rowHeight) + (this.rowHeight / 2) + topOffset);
      }),
      shareReplay(1)
    );
  }

  private optionsToMatrix(options: InstrumentOptions | null, displayParameter: OptionParameters): OptionsMatrix {
    if (!options) {
      return {
        priceIndex: [],
        dateIndex: [],
        options: [],
      };
    }

    const dates = new Set<number>();
    const prices = new Set<number>();
    const optionsMap = new Map<string, Option>();
    let maxPriceIndexLength = 0;
    let maxDisplayParameterLength = 0;

    const getMapKey = (price: number, date: number): string => `${price}:${date}`;

    for (const option of options.options) {
      prices.add(option.strikePrice);

      const date = option.expirationDate.getTime();
      dates.add(date);
      optionsMap.set(getMapKey(option.strikePrice, date), option);
    }

    const sortedPrices = [...prices].sort((a, b) => a - b);
    const sortedDates = [...dates].sort((a, b) => a - b);

    const matrix = new Array<(OptionDisplay | null)[]>(sortedPrices.length);
    for (let i = 0; i < sortedPrices.length; i++) {
      const price = sortedPrices[i];
      maxPriceIndexLength = Math.max(maxPriceIndexLength, price.toString().length);

      matrix[i] = new Array<OptionDisplay | null>(sortedDates.length);

      for (let j = 0; j < sortedDates.length; j++) {
        const option = optionsMap.get(getMapKey(price, sortedDates[j])) ?? null;

        if (!option) {
          matrix[i][j] = null;
          continue;
        }

        const optionDisplay = this.toOptionDisplay(option, options.underlyingAsset, displayParameter);
        matrix[i][j] = optionDisplay;

        maxDisplayParameterLength = Math.max(maxDisplayParameterLength, optionDisplay.displayValue.length);
      }
    }

    return {
      underlyingAsset: options.underlyingAsset,
      priceIndex: sortedPrices,
      dateIndex: sortedDates.map(d => new Date(d)),
      options: matrix,
      meta: {
        maxDisplayParameterLength,
        maxPriceIndexLength
      }
    };
  }

  private toOptionDisplay(option: Option, instrument: UnderlyingAsset, displayParameter: OptionParameters): OptionDisplay {
    const optionDisplay = {
      ...option,
      calculations: {
        ...option.calculations,
        price: MathHelper.roundPrice(option.calculations.price, instrument.minStep)
      },
      displayValue: ''
    };

    const mapper = this.optionDisplayParameterMap.get(displayParameter);
    if (!!mapper) {
      optionDisplay.displayValue = mapper(optionDisplay);
    }

    return optionDisplay;
  }

  private scrollToPrice(matrix: OptionsMatrix): void {
    setTimeout(() => {
      this.bodyScroll$.pipe(
        take(1)
      ).subscribe(bodyScroll => {
        if (!matrix.underlyingAsset) {
          return;
        }

        const currentPrice = matrix.underlyingAsset.lastPrice;
        let strikeIndex: number | null = null;
        for (let i = 0; i < matrix.priceIndex.length; i++) {
          const priceIndex = matrix.priceIndex[i];

          if (priceIndex <= currentPrice) {
            strikeIndex = i;
          }

          if (priceIndex >= currentPrice) {
            break;
          }
        }

        setTimeout(() => {
          if (!!(strikeIndex ?? 0)) {
            const viewPortSize = bodyScroll.measureViewportSize('vertical');
            const visibleItemsCount = viewPortSize / this.rowHeight;
            const centerCorrection = Math.floor(visibleItemsCount / 2) - 1;

            bodyScroll.scrollToIndex(strikeIndex! - centerCorrection);
          }
        });
      });
    });
  }
}
