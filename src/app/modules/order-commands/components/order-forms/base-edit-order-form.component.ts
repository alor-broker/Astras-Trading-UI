import {Component, DestroyRef, EventEmitter, input, Output} from "@angular/core";
import {combineLatest, Observable, shareReplay, switchMap} from "rxjs";
import {PortfolioKey} from "../../../../shared/models/portfolio-key.model";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {filter, map, startWith} from "rxjs/operators";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {AbstractControl, FormControl, Validators} from "@angular/forms";
import {inputNumberValidation} from "../../../../shared/utils/validation-options";
import {AtsValidators} from "../../../../shared/utils/form-validators";
import {OrderFormState} from "../../models/order-form.model";
import {Order} from "../../../../shared/models/orders/order.model";
import {toObservable} from "@angular/core/rxjs-interop";

@Component({
  template: '',
  standalone: false
})
export abstract class BaseEditOrderFormComponent {
  formInstrument$!: Observable<Instrument>;

  @Output()
  formStateChanged = new EventEmitter<OrderFormState>();

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

  protected constructor(
    protected readonly instrumentService: InstrumentsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

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
      Validators.min(inputNumberValidation.negativeMin),
      Validators.max(inputNumberValidation.max),
      AtsValidators.priceStepMultiplicity(newInstrument.minstep)
    ]);
  }
}
