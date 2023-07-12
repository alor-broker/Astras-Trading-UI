import {
  Component, DestroyRef,
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
import {
  BehaviorSubject,
  distinctUntilChanged,
  forkJoin,
  NEVER,
  Observable,
  shareReplay,
  Subject,
  Subscription,
  switchMap,
  take,
  tap
} from 'rxjs';
import { inputNumberValidation } from '../../../../shared/utils/validation-options';
import {
  OrdersBasket,
  OrdersBasketItem
} from '../../models/orders-basket-form.model';
import {
  debounceTime,
  filter,
  finalize,
  map
} from 'rxjs/operators';
import { OrderService } from '../../../../shared/services/orders/order.service';
import { LimitOrder } from '../../../command/models/order.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { Side } from '../../../../shared/models/enums/side.model';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { EvaluationService } from '../../../../shared/services/evaluation.service';
import { GuidGenerator } from '../../../../shared/utils/guid';
import { mapWith } from '../../../../shared/utils/observable-helper';
import { OrdersBasketSettings } from '../../models/orders-basket-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

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

  submitResult$ = new BehaviorSubject<'success' | 'failed' | null>(null);

  itemsContainerWidth$ = new Subject<number>();

  private readonly savedBaskets = new Map<string, OrdersBasket>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly orderService: OrderService,
    private readonly evaluationService: EvaluationService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnDestroy(): void {
    this.formSubscriptions?.unsubscribe();
    this.canSubmit$.complete();
    this.processing$.complete();
    this.submitResult$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<OrdersBasketSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => this.isEqualSettings(previous, current)),
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.initForm(settings);
      this.restoreFormValue(settings!);
      this.submitResult$.next(null);
    });
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
    this.submitResult$.next(null);

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

        if(orders.length > 0) {
          return forkJoin([
              ...orders.map(o => this.orderService.submitLimitOrder(o, settings.portfolio).pipe(take(1)))
            ]
          );
        }

        return NEVER;
      }),
      finalize(() => this.processing$.next(false)),
      take(1)
    ).subscribe(results => {
      this.submitResult$.next(results.every(x => !!x && x.isSuccess) ? 'success' : 'failed');
    });
  }

  itemsContainerWidthChanged(entries: ResizeObserverEntry[]) {
    entries.forEach(x => {
      this.itemsContainerWidth$.next(Math.floor(x.contentRect.width));
    });
  }

  private isEqualSettings(settings1?: OrdersBasketSettings, settings2?: OrdersBasketSettings): boolean {
    if (!settings1 || !settings2) {
      return false;
    }

    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
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
      budget: new FormControl<number | null>(
        null,
        [
          Validators.required,
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

    const saveSub = this.form.valueChanges.subscribe(() => {
      this.saveBasket(settings);
      this.submitResult$.next(null);
    });

    this.formSubscriptions.add(saveSub);
    this.formSubscriptions.add(this.initQuantityCalculation(settings));
  }

  private initQuantityCalculation(settings: OrdersBasketSettings) {
    return this.form!.valueChanges.pipe(
      debounceTime(500),

      map(formValue => {
        const items = formValue.items as Partial<OrdersBasketItem>[];
        const totalBudget = Number(formValue.budget);
        const hasEvaluationParams = (item: Partial<OrdersBasketItem>) => {
          return !!item.instrumentKey && !!item.quota && !!item.price;
        };

        const allItems = items.map(item => ({
          id: item.id!,
          evaluationParams: !isNaN(totalBudget) && totalBudget > 0 && hasEvaluationParams(item)
            ? {
              instrumentKey: item.instrumentKey!,
              budget: Math.floor(totalBudget * Number(item.quota) / 100),
              price: item.price!
            }
            : null
        }));

        return {
          itemsToEvaluate: allItems.filter(x => !!x.evaluationParams),
          skippedItems: allItems.filter(x => !x.evaluationParams),
        };
      }),
      mapWith(
        items => this.evaluationService.evaluateQuantity(settings.portfolio, items.itemsToEvaluate.map(x => x.evaluationParams!)),
        (items, evaluation) => ({ items, evaluation: evaluation ?? [] })
      )
    ).subscribe(({ items, evaluation }) => {
      const setQuantity = (id: string, quantity: number) => {
        const itemsControl = this.asFormArray(this.form!.controls.items);
        const targetControl = itemsControl.controls.find(c => c.value.id === id);
        if (targetControl && targetControl.value.quantity !== quantity) {
          targetControl.patchValue({ quantity: quantity });
        }
      };

      evaluation.forEach((item, index) => {
        const targetItem = items.itemsToEvaluate[index];
        setQuantity(targetItem.id, item.quantityToBuy);
      });

      items.skippedItems.forEach(i => {
        setQuantity(i.id, 0);
      });
    });
  }

  private createItemDraftControl(item: Partial<OrdersBasketItem>): FormControl<Partial<OrdersBasketItem> | null> {
    return new FormControl<Partial<OrdersBasketItem>>({
      ...item,
      id: GuidGenerator.newGuid()
    });
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
