import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from "@angular/forms";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  debounceTime,
  filter,
  map,
  startWith
} from "rxjs/operators";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {
  AsyncPipe,
  KeyValuePipe
} from '@angular/common';
import {BaseOrderForm} from '@terminal-widgets-lib/widgets/order-commands/components/order-forms/base-order-form';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {ConfirmableOrderCommandsService} from '@terminal-core-lib/features/orders/services/confirmable-order-commands.service';
import {SingleOrderEvaluation} from '@terminal-core-lib/features/orders/services/evaluation-service.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {MarketOrderConfig} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  NewMarketOrder,
  OrderCommandResult
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {SubmitGroupResult} from '@terminal-core-lib/features/orders/types/order-group.types';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';
import {ShortNumber} from '@terminal-core-lib/common/components/short-number/short-number';
import {InstrumentBoardSelect} from '@terminal-core-lib/features/instruments/components/instrument-board-select/instrument-board-select';
import {OrderEvaluation} from '@terminal-widgets-lib/widgets/order-commands/components/order-evaluation/order-evaluation';
import {BuySellButtons} from '@terminal-widgets-lib/widgets/order-commands/components/buy-sell-buttons/buy-sell-buttons';
import {NearestTradingSessionComponent} from '@terminal-widgets-lib/widgets/order-commands/components/nearest-trading-session/nearest-trading-session';

@Component({
  selector: 'ats-market-order-form',
  templateUrl: './market-order-form.html',
  styleUrls: ['./market-order-form.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    NzSelectComponent,
    NzOptionComponent,
    AsyncPipe,
    KeyValuePipe,
    InputNumber,
    ShortNumber,
    InstrumentBoardSelect,
    OrderEvaluation,
    BuySellButtons,
    NearestTradingSessionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class MarketOrderForm extends BaseOrderForm implements OnInit, OnDestroy {
  readonly evaluationRequest$ = new BehaviorSubject<SingleOrderEvaluation | null>(null);

  readonly sides = Side;

  readonly initialValues = input<{
    quantity?: number;
  } | null>(null);

  readonly marketOrderConfig = input.required<MarketOrderConfig>();

  timeInForceEnum = TimeInForce;

  private readonly formBuilder = inject(FormBuilder);

  form = this.formBuilder.group({
    quantity: this.formBuilder.nonNullable.control(
      1,
      {
        validators: [
          Validators.required,
          Validators.min(InputNumberValidation.minPositive),
          Validators.max(InputNumberValidation.max)
        ]
      }
    ),
    instrumentGroup: this.formBuilder.nonNullable.control<string>(''),
    timeInForce: this.formBuilder.control<TimeInForce | null>(null),
  });

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly quotesService = inject(QuotesService);

  private readonly orderCommandService = inject(ConfirmableOrderCommandsService);

  get canSubmit(): boolean {
    return this.form.valid;
  }

  ngOnInit(): void {
    this.initInstrumentChange();
    this.initCommonParametersUpdate();
    this.initEvaluationUpdate();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.evaluationRequest$.complete();
  }

  setQuantity(value: number): void {
    this.setCommonParameters({
      quantity: value
    });
  }

  protected changeInstrument(newInstrument: Instrument): void {
    this.form.reset();

    const initialValues = this.initialValues();

    if (initialValues != null) {
      if (initialValues.quantity != null) {
        this.form.controls.quantity.setValue(initialValues.quantity);
      }
    }

    this.form.controls.instrumentGroup.setValue(newInstrument.instrumentGroup ?? '');
  }

  protected prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<OrderCommandResult | SubmitGroupResult> {
    const formValue = this.form.value;

    const marketOrder: NewMarketOrder = {
      instrument: this.getOrderInstrument(formValue, instrument),
      quantity: Number(formValue.quantity),
      side: side
    };

    if (formValue.timeInForce != null) {
      marketOrder.timeInForce = formValue.timeInForce;
    }

    return this.orderCommandService.submitMarketOrder(
      marketOrder,
      portfolioKey
    );
  }

  private initCommonParametersUpdate(): void {
    this.getCommonParameters().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(p => {
      if (p.quantity != null && this.form.controls.quantity.value !== p.quantity) {
        this.form.controls.quantity.setValue(p.quantity);
      }
    });

    this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity})),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      this.setCommonParameters({
        quantity: x.quantity
      });
    });
  }

  private initEvaluationUpdate(): void {
    const formChanges$ = this.form.valueChanges.pipe(
      map(v => ({quantity: v.quantity})),
      distinctUntilChanged((prev, curr) => prev.quantity === curr.quantity),
      startWith(null)
    );

    const getInstrumentWithPortfolio$ = this.getInstrumentWithPortfolio().pipe(
      shareReplay(1)
    );

    const positionChanges$ = this.getInstrumentWithPortfolio().pipe(
      switchMap(x => this.portfolioSubscriptionsService.getInstrumentPositionSubscription(x.portfolioKey, x.instrument)),
      map(p => p?.qtyTFutureBatch ?? 0),
      distinctUntilChanged((prev, curr) => prev === curr),
      startWith(0)
    );

    const lastPrice$ = getInstrumentWithPortfolio$.pipe(
      switchMap(x => this.quotesService.getQuotesSubscription(x.instrument.symbol, x.instrument.exchange, (this.form.controls.instrumentGroup.value as string | undefined) ?? x.instrument.instrumentGroup)),
      map(q => q.last_price),
      distinctUntilChanged((prev, curr) => prev === curr),
      shareReplay({bufferSize: 1, refCount: true})
    );

    combineLatest([
      formChanges$,
      positionChanges$,
      lastPrice$,
      this.activatedChanges$
    ]).pipe(
      filter(([, , , isActivated]) => isActivated),
      takeUntilDestroyed(this.destroyRef),
      debounceTime(500)
    ).subscribe(([, , lastPrice]) => this.updateEvaluation(lastPrice));
  }

  private updateEvaluation(lastPrice: number): void {
    this.getInstrumentWithPortfolio().pipe(
      take(1)
    ).subscribe(x => {
      const formValue = this.form.value;
      if (!(formValue.quantity ?? 0)) {
        this.evaluationRequest$.next(null);
        return;
      }

      this.evaluationRequest$.next({
        portfolio: x.portfolioKey.portfolio,
        instrument: {
          ...InstrumentKeyHelper.toInstrumentKey(x.instrument),
          instrumentGroup: formValue.instrumentGroup ?? x.instrument.instrumentGroup
        },
        instrumentCurrency: x.instrument.currency,
        price: lastPrice,
        lotQuantity: formValue.quantity!
      });
    });
  }
}
