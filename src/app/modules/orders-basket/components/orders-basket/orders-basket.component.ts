import { Component, DestroyRef, OnDestroy, OnInit, input, inject } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
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
import {inputNumberValidation} from '../../../../shared/utils/validation-options';
import {OrdersBasket, OrdersBasketItem} from '../../models/orders-basket-form.model';
import {debounceTime, filter, finalize, map} from 'rxjs/operators';
import {InstrumentKey} from '../../../../shared/models/instruments/instrument-key.model';
import {Side} from '../../../../shared/models/enums/side.model';
import {MathHelper} from '../../../../shared/utils/math-helper';
import {EvaluationService} from '../../../../shared/services/evaluation.service';
import {GuidGenerator} from '../../../../shared/utils/guid';
import {mapWith} from '../../../../shared/utils/observable-helper';
import {DataPreset, OrdersBasketSettings} from '../../models/orders-basket-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NewLimitOrder, OrderCommandResult} from "../../../../shared/models/orders/new-order.model";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
  OrderCommandService
} from "../../../../shared/services/orders/order-command.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {PresetsComponent} from '../presets/presets.component';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {OrdersBasketItemComponent} from '../orders-basket-item/orders-basket-item.component';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {InputNumberComponent} from '../../../../shared/components/input-number/input-number.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-orders-basket',
  templateUrl: './orders-basket.component.html',
  styleUrls: ['./orders-basket.component.less'],
  imports: [
    TranslocoDirective,
    PresetsComponent,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzResizeObserverDirective,
    OrdersBasketItemComponent,
    NzTypographyComponent,
    NzButtonComponent,
    NzIconDirective,
    NzColDirective,
    NzRowDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    InputNumberComponent,
    AsyncPipe
  ]
})
export class OrdersBasketComponent implements OnInit, OnDestroy {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly orderCommandService = inject<OrderCommandService>(ORDER_COMMAND_SERVICE_TOKEN);
  private readonly evaluationService = inject(EvaluationService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly guid = input.required<string>();

  readonly form = this.formBuilder.group({
    budget: this.formBuilder.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(inputNumberValidation.min),
        Validators.max(inputNumberValidation.max)
      ]
    ),
    items: this.formBuilder.array(
      [
        this.createItemDraftControl({quota: 50})
      ],
      [
        Validators.required,
        this.allItemsAreValidValidator,
        this.max100PercentValidator
      ]
    )
  });

  formSubscriptions?: Subscription;
  settings$!: Observable<OrdersBasketSettings>;
  canSubmit$ = new BehaviorSubject<boolean>(false);
  processing$ = new BehaviorSubject(false);

  submitResult$ = new BehaviorSubject<'success' | 'failed' | null>(null);
  currentPresets$!: Observable<DataPreset[]>;

  itemsContainerWidth$ = new Subject<number>();

  private readonly savedBaskets = new Map<string, OrdersBasket>();

  ngOnDestroy(): void {
    this.formSubscriptions?.unsubscribe();
    this.canSubmit$.complete();
    this.processing$.complete();
    this.submitResult$.complete();
  }

  ngOnInit(): void {
    this.settings$ = this.getWidgetSettings().pipe(
      distinctUntilChanged((previous, current) => this.isEqualSettings(previous, current)),
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.initForm(settings);

      const savedValue = this.savedBaskets.get(this.getSavedBasketKey(settings));
      if (savedValue) {
        this.restoreFormValue(savedValue);
      }

      this.submitResult$.next(null);
    });

    this.currentPresets$ = this.getWidgetSettings().pipe(
      map(s => {
        const allPresets = s.presets ?? [];
        return allPresets.filter(p => p.portfolioKey.exchange === s.exchange && p.portfolioKey.portfolio === s.portfolio);
      }),
      shareReplay(1)
    );
  }

  addItemDraft(target: FormArray): void {
    target.push(this.createItemDraftControl({}));
  }

  submitOrders(): void {
    this.submitResult$.next(null);

    this.settings$.pipe(
      take(1),
      filter(() => this.form?.valid ?? false),
      tap(() => this.processing$.next(true)),
      switchMap(settings => {
        const orders: NewLimitOrder[] = [];

        (this.form.value.items ?? []).forEach((item: any) => {
          orders.push({
            side: Side.Buy,
            instrument: item.instrumentKey as InstrumentKey,
            quantity: item.quantity as number,
            price: item.price as number
          });
        });

        if (orders.length > 0) {
          return forkJoin([
              ...orders.map(o => this.orderCommandService.submitLimitOrder(o, settings.portfolio).pipe(take(1)))
            ]
          );
        }

        return NEVER;
      }),
      finalize(() => this.processing$.next(false)),
      take(1)
    ).subscribe(results => {
      this.submitResult$.next(results.every((x: OrderCommandResult | null) => !!x && x.isSuccess) ? 'success' : 'failed');
    });
  }

  itemsContainerWidthChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.itemsContainerWidth$.next(Math.floor(x.contentRect.width));
    });
  }

  savePreset(title: string): void {
    this.getWidgetSettings().pipe(
      take(1)
    ).subscribe(s => {
      const currentBasket = this.getCurrentBasket(false);
      if (!currentBasket) {
        return;
      }

      const newPreset: DataPreset = {
        ...currentBasket,
        id: GuidGenerator.newGuid(),
        title: title,
        portfolioKey: {
          exchange: s.exchange,
          portfolio: s.portfolio
        }
      };

      this.widgetSettingsService.updateSettings<OrdersBasketSettings>(
        this.guid(),
        {
          presets: [
            ...s.presets ?? [],
            newPreset
          ]
        }
      );
    });
  }

  removePreset(presetId: string): void {
    this.getWidgetSettings().pipe(
      take(1)
    ).subscribe(s => {
      this.widgetSettingsService.updateSettings<OrdersBasketSettings>(
        this.guid(),
        {
          presets: (s.presets ?? []).filter(p => p.id !== presetId)
        }
      );
    });
  }

  applyPreset(preset: DataPreset): void {
    this.restoreFormValue(preset);
  }

  private getWidgetSettings(): Observable<OrdersBasketSettings> {
    return this.widgetSettingsService.getSettings<OrdersBasketSettings>(this.guid());
  }

  private isEqualSettings(settings1?: OrdersBasketSettings, settings2?: OrdersBasketSettings): boolean {
    if (!settings1 || !settings2) {
      return false;
    }

    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }

  private saveBasket(settings: OrdersBasketSettings | null): void {
    if (!settings) {
      return;
    }

    const currentBasket = this.getCurrentBasket(true);
    if (!currentBasket) {
      return;
    }

    this.savedBaskets.set(this.getSavedBasketKey(settings), currentBasket);
  }

  private getCurrentBasket(allowPartial: boolean): OrdersBasket | null {
    if (!this.form.valid && !allowPartial) {
      return null;
    }

    const formValue = this.form.value as OrdersBasket;
    return {
      ...formValue,
      budget: Number(formValue.budget),
      items: formValue.items
    };
  }

  private restoreFormValue(savedBasket: OrdersBasket): void {
    this.form?.controls.budget.setValue(savedBasket.budget);

    const items = this.form.controls.items;
    items.clear();

    savedBasket.items.forEach(savedItem => {
      const item = {...savedItem} as Partial<OrdersBasketItem>;
      delete item.quantity;

      items.push(this.createItemDraftControl(item));
    });
  }

  private getSavedBasketKey(settings: OrdersBasketSettings): string {
    return `${settings.portfolio}_${settings.exchange}`;
  }

  private initForm(settings: OrdersBasketSettings): void {
    this.formSubscriptions?.unsubscribe();

    this.form.reset();
    this.form.controls.items.clear();
    this.form.controls.items.push(this.createItemDraftControl({quota: 50}));
    this.form.controls.items.push(this.createItemDraftControl({quota: 50}));

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

  private initQuantityCalculation(settings: OrdersBasketSettings): Subscription {
    return this.form.valueChanges.pipe(
      debounceTime(500),

      map(formValue => {
        const items = formValue.items as Partial<OrdersBasketItem>[];
        const totalBudget = Number(formValue.budget);
        const hasEvaluationParams = (item: Partial<OrdersBasketItem>): boolean => {
          return !!item.instrumentKey && !!(item.quota ?? 0) && !!(item.price ?? 0);
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
        items => this.evaluationService.evaluateBatch(settings.portfolio, items.itemsToEvaluate.map(x => x.evaluationParams!)),
        (items, evaluation) => ({items, evaluation: evaluation ?? []})
      )
    ).subscribe(({items, evaluation}) => {
      const setQuantity = (id: string, quantity: number): void => {
        const itemsControl = this.form.controls.items;
        const targetControl = itemsControl.controls.find(c => c.value != null && c.value.id === id);
        if (targetControl && targetControl.value!.quantity !== quantity) {
          targetControl.patchValue({quantity: quantity});
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
    return this.formBuilder.nonNullable.control<Partial<OrdersBasketItem> | null>(
      {
        ...item,
        id: GuidGenerator.newGuid()
      }
    );
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
