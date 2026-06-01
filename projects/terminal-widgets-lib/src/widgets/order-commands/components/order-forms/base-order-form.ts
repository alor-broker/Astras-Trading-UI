import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  subscribeOn,
  take
} from "rxjs";
import {
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  output
} from "@angular/core";
import {
  filter,
  finalize,
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  FormControl,
  Validators
} from "@angular/forms";
import {
  CommonParameters,
  CommonParametersService
} from "../../services/common-parameters.service";
import {Side} from '@terminal-core-lib/common/types/side.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {OrderCommandResult} from '@terminal-core-lib/features/orders/types/new-order.types';
import {SubmitGroupResult} from '@terminal-core-lib/features/orders/types/order-group.types';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {priceStepMultiplicity} from '@terminal-core-lib/features/forms/validators/price-step-multiplicity';

@Component({
  template: ''
})
export abstract class BaseOrderForm implements OnDestroy {
  readonly requestProcessing$ = new BehaviorSubject<{ orderSide?: Side }>({});

  readonly submitted = output();

  readonly portfolioKey = input.required<PortfolioKey>();

  readonly instrument = input.required<Instrument>();

  readonly activated = input.required<boolean>();

  protected readonly portfolioKeyChanges$ = toObservable(this.portfolioKey).pipe(
    startWith(null),
    shareReplay(1)
  );

  protected readonly instrumentChanges$ = toObservable(this.instrument).pipe(
    startWith(null),
    shareReplay(1)
  );

  protected readonly activatedChanges$ = toObservable(this.activated).pipe(
    startWith(false),
    shareReplay(1)
  );

  protected readonly commonParametersService = inject(CommonParametersService);

  protected readonly destroyRef = inject(DestroyRef);

  abstract get canSubmit(): boolean;

  ngOnDestroy(): void {
    this.requestProcessing$.complete();
  }

  submitOrder(side: Side): void {
    if (!this.canSubmit) {
      return;
    }
    this.requestProcessing$.next({orderSide: side});

    this.getInstrumentWithPortfolio().pipe(
      take(1),
      switchMap(x => this.prepareOrderStream(side, x.instrument, x.portfolioKey)),
      take(1),
      finalize(() => {
        this.requestProcessing$.next({});
      }),
    ).subscribe(r => {
      if (((<OrderCommandResult | null>r)?.isSuccess ?? false) || (<SubmitGroupResult | null>r)?.message === 'success') {
        this.submitted.emit();
      }
    });
  }

  protected abstract prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<OrderCommandResult | SubmitGroupResult | null>;

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.instrumentChanges$,
      portfolioKey: this.portfolioKeyChanges$
    }).pipe(
      filter(x => !!x.instrument && !!x.portfolioKey),
      map(x => ({instrument: x.instrument!, portfolioKey: x.portfolioKey!}))
    );
  }

  protected initInstrumentChange(): void {
    this.getInstrumentWithPortfolio().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => this.changeInstrument(x.instrument));
  }

  protected abstract changeInstrument(instrument: Instrument): void;

  protected enableControl(target: AbstractControl): void {
    target.enable({emitEvent: false});
  }

  protected disableControl(target: AbstractControl): void {
    target.disable({emitEvent: false});
  }

  protected getOrderInstrument(formValue: { instrumentGroup?: string }, instrument: Instrument): InstrumentKey {
    return {
      ...InstrumentKeyHelper.toInstrumentKey(instrument),
      instrumentGroup: formValue.instrumentGroup ?? instrument.instrumentGroup ?? ''
    };
  }

  protected setPriceValidators(target: FormControl<number | null>, newInstrument: Instrument): void {
    target.clearValidators();
    target.addValidators([
      Validators.required,
      Validators.min(InputNumberValidation.minNegative),
      Validators.max(InputNumberValidation.max),
      priceStepMultiplicity(newInstrument.minstep)
    ]);
  }

  protected setCommonParameters(params: Partial<CommonParameters>): void {
    this.activatedChanges$.pipe(
      take(1)
    ).subscribe(isActivated => {
      if (isActivated) {
        this.commonParametersService.setParameters(params);
      }
    });
  }

  protected getCommonParameters(): Observable<Partial<CommonParameters>> {
    return this.commonParametersService.parameters$.pipe(
      subscribeOn(asyncScheduler)
    );
  }
}
