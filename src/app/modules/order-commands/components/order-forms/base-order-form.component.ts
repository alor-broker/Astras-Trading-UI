import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { Instrument } from "../../../../shared/models/instruments/instrument.model";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  take
} from "rxjs";
import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output
} from "@angular/core";
import { Side } from "../../../../shared/models/enums/side.model";
import {
  filter,
  finalize,
  map,
  switchMap
} from "rxjs/operators";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  AbstractControl,
  FormControl,
  Validators
} from "@angular/forms";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { toInstrumentKey } from "../../../../shared/utils/instruments";
import { SubmitGroupResult } from "../../../../shared/models/orders/orders-group.model";
import { SubmitOrderResult } from "../../../../shared/models/orders/new-order.model";
import { inputNumberValidation } from "../../../../shared/utils/validation-options";
import { AtsValidators } from "../../../../shared/utils/form-validators";
import {
  CommonParameters,
  CommonParametersService
} from "../../services/common-parameters.service";

@Component({
  template: ''
})
export abstract class BaseOrderFormComponent implements OnDestroy {
  readonly formInstrument$ = new BehaviorSubject<Instrument | null>(null);
  readonly portfolioKey$ = new BehaviorSubject<PortfolioKey | null>(null);
  readonly requestProcessing$ = new BehaviorSubject<{ orderSide?: Side }>({});
  readonly isActivated$ = new BehaviorSubject<boolean>(false);

  @Output()
  submitted = new EventEmitter();

  protected constructor(
    protected commonParametersService: CommonParametersService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  @Input({ required: true })
  set portfolioKey(value: PortfolioKey) {
    this.portfolioKey$.next(value);
  }

  @Input({ required: true })
  set instrument(value: Instrument) {
    this.formInstrument$.next(value);
  }

  @Input({ required: true })
  set activated(value: boolean) {
    this.isActivated$.next(value);
  }

  abstract get canSubmit(): boolean;

  ngOnDestroy(): void {
    this.formInstrument$.complete();
    this.portfolioKey$.complete();
    this.requestProcessing$.complete();
    this.isActivated$.complete();
  }

  submitOrder(side: Side): void {
    if (!this.canSubmit) {
      return;
    }
    this.requestProcessing$.next({ orderSide: side });

    this.getInstrumentWithPortfolio().pipe(
      take(1),
      switchMap(x => this.prepareOrderStream(side, x.instrument, x.portfolioKey)),
      take(1),
      finalize(() => {
        this.requestProcessing$.next({});
      }),
    ).subscribe(r => {
      if (((<SubmitOrderResult | null>r)?.isSuccess ?? false) || (<SubmitGroupResult | null>r)?.message === 'success') {
        this.submitted.emit();
      }
    });
  }

  protected abstract prepareOrderStream(side: Side, instrument: Instrument, portfolioKey: PortfolioKey): Observable<SubmitOrderResult | SubmitGroupResult | null>;

  protected getInstrumentWithPortfolio(): Observable<{ instrument: Instrument, portfolioKey: PortfolioKey }> {
    return combineLatest({
      instrument: this.formInstrument$,
      portfolioKey: this.portfolioKey$
    }).pipe(
      filter(x => !!x.instrument && !!x.portfolioKey),
      map(x => ({ instrument: x.instrument!, portfolioKey: x.portfolioKey! }))
    );
  }

  protected initInstrumentChange(): void {
    this.getInstrumentWithPortfolio().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => this.changeInstrument(x.instrument, x.portfolioKey));
  }

  protected abstract changeInstrument(instrument: Instrument, portfolioKey: PortfolioKey): void;

  protected enableControl(target: AbstractControl): void {
    target.enable({ emitEvent: false });
  }

  protected disableControl(target: AbstractControl): void {
    target.disable({ emitEvent: false });
  }

  protected getOrderInstrument(formValue: { instrumentGroup?: string }, instrument: Instrument): InstrumentKey {
    return {
      ...toInstrumentKey(instrument),
      instrumentGroup: formValue.instrumentGroup ?? instrument.instrumentGroup ?? ''
    };
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

  protected setCommonParameters(params: Partial<CommonParameters>): void {
    this.isActivated$.pipe(
      take(1)
    ).subscribe(isActivated => {
      if (isActivated) {
        this.commonParametersService.setParameters(params);
      }
    });
  }

  protected getCommonParameters(): Observable<Partial<CommonParameters>> {
    return this.commonParametersService.parameters$;
  }
}
