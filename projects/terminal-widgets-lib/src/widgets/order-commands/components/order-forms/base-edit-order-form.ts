import {
  Component,
  DestroyRef,
  inject,
  input,
  output
} from "@angular/core";
import {
  combineLatest,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {
  filter,
  map,
  startWith
} from "rxjs/operators";
import {
  AbstractControl,
  FormControl,
  Validators
} from "@angular/forms";
import {toObservable} from "@angular/core/rxjs-interop";
import {Instrument} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {OrderFormState} from '@terminal-widgets-lib/widgets/order-commands/types/order-form.types';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {Order} from '@terminal-core-lib/features/portfolios/types/order.types';
import {InputNumberValidation} from "@terminal-core-lib/common/constants/validation.constants";
import {priceStepMultiplicity} from "@terminal-core-lib/features/forms/validators/price-step-multiplicity";

@Component({
  template: ''
})
export abstract class BaseEditOrderForm {
  formInstrument$!: Observable<Instrument>;

  readonly formStateChanged = output<OrderFormState>();

  readonly portfolioKey = input.required<PortfolioKey>();

  readonly orderId = input.required<string>();

  protected readonly portfolioKeyChanges$ = toObservable(this.portfolioKey).pipe(
    startWith(null),
    shareReplay(1)
  );

  protected readonly orderIdChanges$ = toObservable(this.orderId).pipe(
    startWith(null),
    shareReplay(1)
  );

  protected readonly instrumentService = inject(InstrumentsService);

  protected readonly destroyRef = inject(DestroyRef);

  protected initFormInstrument(order$: Observable<Order>): void {
    const instrumentKey$ = order$.pipe(
      map(o => o.targetInstrument)
    );

    this.formInstrument$ = instrumentKey$.pipe(
      switchMap(instrumentKey => this.instrumentService.getInstrument(instrumentKey)),
      filter((i): i is Instrument => !!i),
      shareReplay(1)
    );
  }

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.formInstrument$,
      portfolioKey: this.portfolioKeyChanges$
    }).pipe(
      filter(x => !!(x.instrument as Instrument | null) && !!x.portfolioKey),
      map(x => ({instrument: x.instrument!, portfolioKey: x.portfolioKey!})),
    );
  }

  protected enableControl(target: AbstractControl): void {
    target.enable({emitEvent: false});
  }

  protected disableControl(target: AbstractControl): void {
    target.disable({emitEvent: false});
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
}
