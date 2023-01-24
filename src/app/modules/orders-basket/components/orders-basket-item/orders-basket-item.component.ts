import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  UntypedFormGroup,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { inputNumberValidation } from '../../../../shared/utils/validation-options';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  takeUntil
} from 'rxjs';
import { map, } from 'rxjs/operators';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { isInstrumentEqual } from '../../../../shared/utils/settings-helper';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { QuotesService } from '../../../../shared/services/quotes.service';
import { OrdersBasketItem } from '../../models/orders-basket-form.model';
import { AtsValidators } from '../../../../shared/utils/form-validators';

@Component({
  selector: 'ats-orders-basket-item[exchange]',
  templateUrl: './orders-basket-item.component.html',
  styleUrls: ['./orders-basket-item.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OrdersBasketItemComponent
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: OrdersBasketItemComponent
    },
  ]
})
export class OrdersBasketItemComponent implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  @Input()
  exchange!: string;

  @Input()
  portfolio!: string;

  @Input()
  enableDelete: boolean = true;
  @Output()
  delete = new EventEmitter();

  readonly validationOptions = {
    quota: {
      min: 0.1,
      max: 100
    },
    quantity: {
      min: 1,
      max: inputNumberValidation.max
    },
    price: {
      min: inputNumberValidation.min,
      max: inputNumberValidation.max
    }
  };
  form!: UntypedFormGroup;
  containerWidth$ = new BehaviorSubject<number>(0);
  instrument$!: Observable<Instrument | null>;
  displayMode$?: Observable<'table-item' | 'compact' | 'ultra-compact'>;
  showLabels$?: Observable<boolean>;
  itemIndex$ = new BehaviorSubject<number>(0);
  private readonly onChangeSubs: Subscription[] = [];
  private totalBudget$ = new BehaviorSubject<number | null>(null);
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly instrumentsService: InstrumentsService,
    private readonly quotesService: QuotesService
  ) {
  }

  @Input()
  set itemIndex(value: number) {
    this.itemIndex$.next(value);
  }

  @Input()
  set totalBudget(value: number | null) {
    this.totalBudget$.next(value);
  }

  validate(): ValidationErrors | null {
    if (this.form.valid) {
      return null;
    }

    let errors: any = {};

    errors = this.addControlErrors(errors, "instrumentKey");
    errors = this.addControlErrors(errors, "quota");
    errors = this.addControlErrors(errors, "quantity");
    errors = this.addControlErrors(errors, "price");

    return errors;
  }

  addControlErrors(allErrors: any, controlName: string) {

    const errors = { ...allErrors };

    const controlErrors = this.form.controls[controlName].errors;

    if (controlErrors) {
      errors[controlName] = controlErrors;
    }

    return errors;
  }

  ngOnInit(): void {
    this.initSizeDependedState();
    this.initForm();
    this.initInstrumentUpdate();
    this.initPriceUpdate();
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    for (let sub of this.onChangeSubs) {
      sub.unsubscribe();
    }

    this.containerWidth$.complete();
    this.itemIndex$.complete();
    this.totalBudget$.complete();
  }

  registerOnChange(onChange: any): void {
    const sub = this.form.valueChanges.pipe(
      map(x => ({
        ...x,
        quota: Number(x.quota),
        price: Number(x.price),
        quantity: Number(x.quantity)
      } as OrdersBasketItem))
    ).subscribe(onChange);
    this.onChangeSubs.push(sub);
  }

  registerOnTouched(onTouched: any): void {
    this.onTouched = onTouched;
  }

  writeValue(formValue: Partial<OrdersBasketItem>): void {
    Object.keys(formValue).forEach(key => {
      const newValue = (formValue as any)[key];
      const oldValue = this.form.controls[key]?.value;
      if (newValue !== oldValue) {
        this.form.controls[key].setValue(newValue);
      }
    });
  }

  onTouched: Function = () => {
  };

  containerSizeChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.containerWidth$.next(Math.floor(x.contentRect.width));
    });
  }

  private initSizeDependedState() {
    this.displayMode$ = this.containerWidth$.pipe(
      map(w => {
        if (w < 250) {
          return 'ultra-compact';
        }

        if (w < 450) {
          return 'compact';
        }

        return 'table-item';
      })
    );

    this.showLabels$ = combineLatest([
      this.displayMode$,
      this.itemIndex$
    ]).pipe(
      map(([displayMode, itemIndex]) => displayMode === 'compact' || displayMode === 'ultra-compact' || itemIndex === 0),
      shareReplay(1)
    );
  }

  private initInstrumentUpdate() {
    this.instrument$ = this.form.valueChanges.pipe(
      map(formValue => formValue.instrumentKey),
      distinctUntilChanged((previous, current) => isInstrumentEqual(previous, current)),
      switchMap(instrument => {
        if (!!instrument) {
          return this.instrumentsService.getInstrument(instrument);
        }

        return of(null);
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private initPriceUpdate() {
    this.instrument$.pipe(
      filter(x => !!x),
      switchMap(instrument => this.quotesService.getLastPrice(instrument!)),
      takeUntil(this.destroy$),
    ).subscribe(lastPrice => {
      if (lastPrice) {
        this.form.controls.price.setValue(lastPrice);
      }
    });

    this.form.controls.price.addAsyncValidators(AtsValidators.priceStepMultiplicityAsync(this.instrument$.pipe(map(x => x?.minstep ?? null))));
  }

  private initForm() {
    this.form = new FormGroup({
      instrumentKey: new FormControl<InstrumentKey | null>(null, Validators.required),
      quota: new FormControl(
        null,
        [
          Validators.required,
          Validators.min(this.validationOptions.quota.min),
          Validators.max(this.validationOptions.quota.max)
        ]
      ),
      quantity: new FormControl(
        0,
        [
          Validators.required,
          Validators.min(this.validationOptions.quantity.min),
          Validators.max(this.validationOptions.quantity.max)
        ]
      ),
      price: new FormControl(
        null,
        [
          Validators.required,
          Validators.min(this.validationOptions.price.min),
          Validators.max(this.validationOptions.price.max)
        ]
      ),
      id: new FormControl(null, Validators.required)
    });
  }
}
