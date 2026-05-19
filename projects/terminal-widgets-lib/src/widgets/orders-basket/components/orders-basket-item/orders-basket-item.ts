import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators
} from '@angular/forms';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  shareReplay,
  Subscription,
  switchMap,
} from 'rxjs';
import {map,} from 'rxjs/operators';
import {
  takeUntilDestroyed,
  toObservable
} from "@angular/core/rxjs-interop";
import {
  AsyncPipe,
  NgClass
} from '@angular/common';
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
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {
  Instrument,
  InstrumentKey
} from '@terminal-core-lib/common/types/instrument.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {priceStepMultiplicityAsync} from '@terminal-core-lib/features/forms/validators/price-step-multiplicity';
import {OrdersBasketItem as OrdersBasketItemType} from '../../types/orders-basket-form.types'
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';

@Component({
  selector: 'ats-orders-basket-item',
  templateUrl: './orders-basket-item.html',
  styleUrls: ['./orders-basket-item.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: OrdersBasketItem
    },
    {
      provide: NG_VALIDATORS,
      multi: true,
      useExisting: OrdersBasketItem
    },
  ],
  imports: [
    NgClass,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzInputDirective,
    NzButtonComponent,
    NzIconDirective,
    AsyncPipe,
    InlineInstrumentSearch,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrdersBasketItem implements OnInit, OnDestroy, ControlValueAccessor, Validator {
  readonly exchange = input.required<string>();

  readonly enableDelete = input(true);

  readonly delete = output();

  readonly validationOptions = {
    quota: {
      min: 0.1,
      max: 100
    },
    quantity: {
      min: 1,
      max: InputNumberValidation.max
    },
    price: {
      min: InputNumberValidation.minPositive,
      max: InputNumberValidation.max
    }
  };

  instrument$!: Observable<Instrument | null>;

  displayMode$?: Observable<'table-item' | 'compact' | 'ultra-compact'>;

  showLabels$?: Observable<boolean>;

  readonly width = input<number | null>(null);

  readonly itemIndex = input<number>(0);

  protected readonly widthChanges$ = toObservable(this.width);

  protected readonly itemIndexChanges$ = toObservable(this.itemIndex);

  private readonly instrumentsService = inject(InstrumentsService);

  private readonly quotesService = inject(QuotesService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    instrumentKey: this.formBuilder.control<InstrumentKey | null>(null, Validators.required),
    quota: this.formBuilder.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(this.validationOptions.quota.min),
        Validators.max(this.validationOptions.quota.max)
      ]
    ),
    quantity: this.formBuilder.nonNullable.control(
      0,
      [
        Validators.required,
        Validators.min(this.validationOptions.quantity.min),
        Validators.max(this.validationOptions.quantity.max)
      ]
    ),
    price: this.formBuilder.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(this.validationOptions.price.min),
        Validators.max(this.validationOptions.price.max)
      ]
    ),
    id: this.formBuilder.nonNullable.control("", Validators.required)
  });

  private readonly destroyRef = inject(DestroyRef);

  private readonly onChangeSubs: Subscription[] = [];

  validate(): ValidationErrors | null {
    if (this.form.valid) {
      return null;
    }

    let errors: Record<string, ValidationErrors> = {};

    errors = this.addControlErrors(errors, "instrumentKey");
    errors = this.addControlErrors(errors, "quota");
    errors = this.addControlErrors(errors, "quantity");
    errors = this.addControlErrors(errors, "price");

    return errors;
  }

  addControlErrors(allErrors: Record<string, ValidationErrors>, controlName: string): Record<string, ValidationErrors> {
    const errors = {...allErrors};

    const controlErrors = (<FormGroup>this.form).controls[controlName].errors;

    if (controlErrors) {
      errors[controlName] = controlErrors;
    }

    return errors;
  }

  ngOnInit(): void {
    this.initSizeDependedState();
    this.initInstrumentUpdate();
    this.initPriceUpdate();
  }

  ngOnDestroy(): void {
    for (const sub of this.onChangeSubs) {
      sub.unsubscribe();
    }
  }

  registerOnChange(onChange: any): void {
    const sub = this.form.valueChanges.pipe(
      map(x => ({
        ...x,
        instrumentKey: x.instrumentKey == null ? null : InstrumentKeyHelper.toInstrumentKey(x.instrumentKey),
        quota: Number(x.quota),
        price: Number(x.price),
        quantity: Number(x.quantity)
      } as OrdersBasketItemType))
    ).subscribe(onChange);
    this.onChangeSubs.push(sub);
  }

  registerOnTouched(onTouched: (...args: any[]) => any): void {
    this.onTouched = onTouched;
  }

  writeValue(formValue: Partial<OrdersBasketItemType>): void {
    Object.keys(formValue).forEach(key => {
      const newValue = formValue[key as keyof OrdersBasketItemType];
      const oldValue: unknown = (<FormGroup>this.form).controls[key].value;
      if (newValue !== oldValue) {
        (<FormGroup>this.form).controls[key].setValue(newValue);
      }
    });
  }

  onTouched: () => void = () => {
  };

  private initSizeDependedState(): void {
    this.displayMode$ = this.widthChanges$.pipe(
      filter(w => !!(w ?? 0)),
      map(w => {
        if (w! < 250) {
          return 'ultra-compact';
        }

        if (w! < 450) {
          return 'compact';
        }

        return 'table-item';
      })
    );

    this.showLabels$ = combineLatest([
      this.displayMode$,
      this.itemIndexChanges$,
    ]).pipe(
      map(([displayMode, itemIndex]) => displayMode === 'compact' || displayMode === 'ultra-compact' || itemIndex === 0),
      shareReplay(1)
    );
  }

  private initInstrumentUpdate(): void {
    this.instrument$ = this.form.controls.instrumentKey.valueChanges.pipe(
      distinctUntilChanged((previous, current) => InstrumentEqualityComparer.equals(previous, current)),
      switchMap(instrument => {
        if (instrument) {
          return this.instrumentsService.getInstrument(instrument);
        }

        return of(null);
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private initPriceUpdate(): void {
    this.instrument$.pipe(
      filter((x, index) => {
          if (!x) {
            return false;
          }

          return !(index === 0 && this.form.controls.price.value != null);
        }
      ),
      switchMap(instrument => this.quotesService.getLastPrice(instrument!)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(lastPrice => {
      if (lastPrice != null) {
        this.form.controls.price.setValue(lastPrice);
      }
    });

    this.form.controls.price.addAsyncValidators(priceStepMultiplicityAsync(this.instrument$.pipe(map(x => x?.minstep ?? null))));

    this.form.valueChanges
      .pipe(
        distinctUntilChanged((prev, curr) => prev.price === curr.price && prev.instrumentKey === curr.instrumentKey),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.form.controls.price.updateValueAndValidity();
      });
  }
}
