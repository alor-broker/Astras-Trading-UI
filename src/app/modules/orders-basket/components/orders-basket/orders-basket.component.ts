import {
  Component,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  UntypedFormArray,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { OrdersBasketSettings } from '../../../../shared/models/settings/orders-basket-settings.model';
import {
  BehaviorSubject,
  forkJoin,
  Observable,
  of,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs';
import { inputNumberValidation } from '../../../../shared/utils/validation-options';
import {
  OrdersBasket,
  OrdersBasketItem
} from '../../models/orders-basket-form.model';
import {
  filter,
  finalize
} from 'rxjs/operators';
import { OrderService } from '../../../../shared/services/orders/order.service';
import { LimitOrder } from '../../../command/models/order.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { MathHelper } from '../../../../shared/utils/math-helper';

@Component({
  selector: 'ats-orders-basket[guid]',
  templateUrl: './orders-basket.component.html',
  styleUrls: ['./orders-basket.component.less']
})
export class OrdersBasketComponent implements OnInit, OnDestroy {
  @Input()
  guid!: string;
  form?: UntypedFormGroup;
  formSubscriptions?: Subscription;
  settings$!: Observable<OrdersBasketSettings>;
  canSubmit$ = new BehaviorSubject<boolean>(false);
  processing$ = new BehaviorSubject(false);

  private readonly savedBaskets = new Map<string, OrdersBasket>();
  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly orderService: OrderService
  ) {
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();

    this.formSubscriptions?.unsubscribe();
    this.canSubmit$.complete();
    this.processing$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<OrdersBasketSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(settings => {
      this.initForm(settings);
      this.restoreFormValue(settings!);
    });
  }

  getBudget(form: UntypedFormGroup): number | null {
    const value = Number(form.controls.budget.value);
    return isNaN(value) ? null : value;
  }

  asFormArray(control: AbstractControl): FormArray {
    return control as UntypedFormArray;
  }

  asFormControl(control: AbstractControl): UntypedFormControl {
    return control as UntypedFormControl;
  }

  addItemDraft(target: FormArray) {
    target.push(this.createItemDraftControl({}));
  }

  submitOrders() {
    this.settings$.pipe(
      take(1),
      filter(() => !!this.form?.valid),
      tap(() => this.processing$.next(true)),
      switchMap(settings => {
        const orders: LimitOrder[] = [];

        this.form?.value.items.forEach((item: any) => {
          orders.push({
            side: Side.Buy,
            instrument: item.instrumentKey as InstrumentKey,
            quantity: item.quantity,
            price: item.price
          });
        });

        return forkJoin([
            of(null),
            ...orders.map(o => this.orderService.submitLimitOrder(o, settings.portfolio).pipe(take(1)))
          ]
        );
      }),
      finalize(() => this.processing$.next(false)),
      take(1)
    ).subscribe();
  }

  private saveBasket(settings: OrdersBasketSettings | null) {
    if (!settings || !this.form) {
      return;
    }

    const formValue = this.form.value;
    const basket = {
      ...formValue,
      budget: Number(formValue.budget),
      items: formValue.items
    } as OrdersBasket;

    this.savedBaskets.set(this.getSavedBasketKey(settings), basket);
  }

  private restoreFormValue(settings: OrdersBasketSettings) {
    const savedValue = this.savedBaskets.get(this.getSavedBasketKey(settings));
    if (!savedValue) {
      return;
    }

    this.form?.controls.budget.setValue(savedValue.budget);

    const items = this.asFormArray(this.form?.controls.items!);
    items.clear();

    savedValue.items.forEach(savedItem => {
      const item = { ...savedItem } as Partial<OrdersBasketItem>;
      delete item.quantity;

      items.push(this.createItemDraftControl(item));
    });
  }

  private getSavedBasketKey(settings: OrdersBasketSettings): string {
    return `${settings.portfolio}_${settings.exchange}`;
  }

  private initForm(settings: OrdersBasketSettings) {
    this.formSubscriptions?.unsubscribe();

    this.form = new UntypedFormGroup({
      budget: new FormControl<number>(
        0,
        [
          Validators.min(inputNumberValidation.min),
          Validators.max(inputNumberValidation.max)
        ]),
      items: new FormArray([
          this.createItemDraftControl({ quota: 50 }),
          this.createItemDraftControl({ quota: 50 }),
        ],
        [
          Validators.required,
          this.allItemsAreValidValidator,
          this.max100PercentValidator
        ])
    });

    this.formSubscriptions = this.form.statusChanges.subscribe(status => {
      // submit button disabled status for some reason lagging behind by 1 status when updating budget
      setTimeout(() => {
        this.canSubmit$.next(status === 'VALID');
      });
    });

    const valueSub = this.form.valueChanges.subscribe(() => this.saveBasket(settings));
    this.formSubscriptions.add(valueSub);
  }

  private createItemDraftControl(item: Partial<OrdersBasketItem>): FormControl<Partial<OrdersBasketItem> | null> {
    return new FormControl<Partial<OrdersBasketItem>>(item);
  }

  private allItemsAreValidValidator(itemsControl: FormArray<FormControl<Partial<OrdersBasketItem> | null>>): ValidationErrors | null {
    return itemsControl.controls.every(x => x.valid)
      ? null
      : ({
        invalidItems: true
      });
  }

  private max100PercentValidator(itemsControl: FormArray<FormControl<Partial<OrdersBasketItem> | null>>): ValidationErrors | null {
    if (itemsControl.controls.length === 1) {
      return null;
    }

    const sum = itemsControl.controls
      .map(c => {
          const quota = Number(c.value?.quota);
          return isNaN(quota) ? 0 : quota;
        }
      ).reduce((prev, cur) => prev + cur, 0);

    return sum > 100
      ? {
        max100Percent: {
          actual: MathHelper.round(sum, 1)
        }
      }
      : null;
  }
}
