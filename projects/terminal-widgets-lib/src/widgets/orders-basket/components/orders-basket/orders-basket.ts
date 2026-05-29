import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
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
import {
  debounceTime,
  filter,
  finalize,
  map
} from 'rxjs/operators';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {NzTypographyComponent} from 'ng-zorro-antd/typography';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {AsyncPipe} from '@angular/common';
import {
  NzRadioComponent,
  NzRadioGroupComponent
} from "ng-zorro-antd/radio";
import {
  NzOptionComponent,
  NzSelectComponent
} from "ng-zorro-antd/select";
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';
import {MarginOrderConfirmationService} from '@terminal-core-lib/features/orders/services/margin-order-notification.service';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {InputNumberValidation} from '@terminal-core-lib/common/constants/validation.constants';
import {
  DataPreset,
  OrdersBasketWidgetSettings
} from '@terminal-widgets-lib/widgets/orders-basket/widget-settings.types';
import {
  CalculationMode,
  OrdersBasket as OrdersBasketType,
  OrdersBasketItem as OrdersBasketItemType
} from '@terminal-widgets-lib/widgets/orders-basket/types/orders-basket-form.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {
  NewLimitOrder,
  OrderCommandResult
} from '@terminal-core-lib/features/orders/types/new-order.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {Presets} from '@terminal-widgets-lib/widgets/orders-basket/components/presets/presets';
import {OrdersBasketItem} from '@terminal-widgets-lib/widgets/orders-basket/components/orders-basket-item/orders-basket-item';
import {InputNumber} from '@terminal-core-lib/common/components/input-number/input-number';


@Component({
  selector: 'ats-orders-basket',
  templateUrl: './orders-basket.html',
  styleUrls: ['./orders-basket.less'],
  imports: [
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzResizeObserverDirective,
    NzTypographyComponent,
    NzButtonComponent,
    NzIconDirective,
    NzColDirective,
    NzRowDirective,
    NzFormItemComponent,
    NzFormLabelComponent,
    NzFormControlComponent,
    AsyncPipe,
    NzRadioComponent,
    NzRadioGroupComponent,
    NzOptionComponent,
    NzSelectComponent,
    Presets,
    OrdersBasketItem,
    InputNumber
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrdersBasket implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  formSubscriptions?: Subscription;

  settings$!: Observable<OrdersBasketWidgetSettings>;

  canSubmit$ = new BehaviorSubject<boolean>(false);

  processing$ = new BehaviorSubject(false);

  submitResult$ = new BehaviorSubject<'success' | 'failed' | null>(null);

  currentPresets$!: Observable<DataPreset[]>;

  itemsContainerWidth$ = new Subject<number>();

  protected readonly Sides = Side;

  protected readonly CalculationMode = CalculationMode;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly evaluationService = inject(EvaluationService);

  private readonly marginOrderConfirmationService = inject(MarginOrderConfirmationService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    budget: this.formBuilder.control<number | null>(
      null,
      [
        Validators.required,
        Validators.min(InputNumberValidation.minPositive),
        Validators.max(InputNumberValidation.max)
      ]
    ),
    side: this.formBuilder.nonNullable.control(
      Side.Buy,
      [
        Validators.required,
      ]
    ),
    mode: this.formBuilder.nonNullable.control(
      CalculationMode.Cash,
      [
        Validators.required,
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

  private readonly destroyRef = inject(DestroyRef);

  private readonly savedBaskets = new Map<string, OrdersBasketType>();

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
      mapWith(
        settings => this.marginOrderConfirmationService.checkWithConfirmation({
          exchange: settings.exchange,
          portfolio: settings.portfolio
        }),
        (source, output) => ({settings: source, isConfirmed: output})),
      switchMap(x => {
        const orders: NewLimitOrder[] = [];

        (this.form.value.items ?? []).forEach((item: any) => {
          orders.push({
            side: this.form.value.side ?? Side.Buy,
            instrument: item.instrumentKey as InstrumentKey,
            quantity: item.quantity as number,
            price: item.price as number,
            allowMargin: x.isConfirmed ?? undefined
          });
        });

        if (orders.length > 0) {
          return forkJoin([
              ...orders.map(o => this.orderCommandService.submitLimitOrder(o, x.settings.portfolio).pipe(take(1)))
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

      this.widgetSettingsService.updateSettings<OrdersBasketWidgetSettings>(
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
      this.widgetSettingsService.updateSettings<OrdersBasketWidgetSettings>(
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

  private getWidgetSettings(): Observable<OrdersBasketWidgetSettings> {
    return this.widgetSettingsService.getSettings<OrdersBasketWidgetSettings>(this.guid());
  }

  private isEqualSettings(settings1?: OrdersBasketWidgetSettings, settings2?: OrdersBasketWidgetSettings): boolean {
    if (!settings1 || !settings2) {
      return false;
    }

    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }

  private saveBasket(settings: OrdersBasketWidgetSettings | null): void {
    if (!settings) {
      return;
    }

    const currentBasket = this.getCurrentBasket(true);
    if (!currentBasket) {
      return;
    }

    this.savedBaskets.set(this.getSavedBasketKey(settings), currentBasket);
  }

  private getCurrentBasket(allowPartial: boolean): OrdersBasketType | null {
    if (!this.form.valid && !allowPartial) {
      return null;
    }

    const formValue = this.form.value as OrdersBasketType;
    const side = formValue.side ?? Side.Buy;

    return {
      ...formValue,
      budget: Number(formValue.budget),
      side,
      mode: this.getModeBySide(side, formValue.mode),
      items: formValue.items
    };
  }

  private restoreFormValue(savedBasket: OrdersBasketType): void {
    const side = savedBasket.side ?? Side.Buy;

    this.form.controls.budget.setValue(savedBasket.budget);
    this.form.controls.side.setValue(side);
    this.form.controls.mode.setValue(this.getModeBySide(side, savedBasket.mode));

    const items = this.form.controls.items;
    items.clear();

    savedBasket.items.forEach(savedItem => {
      const item = {...savedItem} as Partial<OrdersBasketItemType>;
      delete item.quantity;

      items.push(this.createItemDraftControl(item));
    });
  }

  private getSavedBasketKey(settings: OrdersBasketWidgetSettings): string {
    return `${settings.portfolio}_${settings.exchange}`;
  }

  private initForm(settings: OrdersBasketWidgetSettings): void {
    this.formSubscriptions?.unsubscribe();

    this.form.reset();
    this.form.controls.items.clear();
    this.form.controls.items.push(this.createItemDraftControl({quota: 50}));
    this.form.controls.items.push(this.createItemDraftControl({quota: 50}));
    this.updateModeControlBySide(this.form.controls.side.value);

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
    this.formSubscriptions.add(this.initForcedCashModeForSell());
    this.formSubscriptions.add(this.initQuantityCalculation(settings));
  }

  private initForcedCashModeForSell(): Subscription {
    return this.form.controls.side.valueChanges.subscribe(side => {
      this.updateModeControlBySide(side);
    });
  }

  private updateModeControlBySide(side: Side): void {
    const modeControl = this.form.controls.mode;

    if (side === Side.Sell) {
      if (modeControl.value !== CalculationMode.Cash) {
        modeControl.setValue(CalculationMode.Cash, {emitEvent: false});
      }

      if (modeControl.enabled) {
        modeControl.disable({emitEvent: false});
      }

      return;
    }

    if (modeControl.disabled) {
      modeControl.enable({emitEvent: false});
    }
  }

  private initQuantityCalculation(settings: OrdersBasketWidgetSettings): Subscription {
    return this.form.valueChanges.pipe(
      debounceTime(500),

      map(formValue => {
        const items = formValue.items as Partial<OrdersBasketItemType>[];
        const totalBudget = Number(formValue.budget);

        const hasEvaluationParams = (item: Partial<OrdersBasketItemType>): boolean => {
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
      const side = this.form.value.side ?? Side.Buy;
      const mode = this.getModeBySide(side, this.form.value.mode);

      const setQuantity = (id: string, quantity: number): void => {
        const itemsControl = this.form.controls.items;
        const targetControl = itemsControl.controls.find(c => c.value != null && c.value.id === id);
        if (targetControl && targetControl.value!.quantity !== quantity) {
          targetControl.patchValue({quantity: quantity});
        }
      };

      evaluation.forEach((item, index) => {
        const targetItem = items.itemsToEvaluate[index];

        if (side === Side.Buy) {
          if (mode === CalculationMode.Margin) {
            setQuantity(targetItem.id, item.quantityToBuy);
          } else {
            setQuantity(targetItem.id, item.notMarginQuantityToBuy);
          }
          return;
        }

        if (mode === CalculationMode.Margin) {
          setQuantity(targetItem.id, item.quantityToSell);
        } else {
          setQuantity(targetItem.id, item.notMarginQuantityToSell);
        }
      });

      items.skippedItems.forEach(i => {
        setQuantity(i.id, 0);
      });
    });
  }

  private getModeBySide(side: Side, mode: CalculationMode | undefined | null): CalculationMode {
    return side === Side.Sell
      ? CalculationMode.Cash
      : mode ?? CalculationMode.Margin;
  }

  private createItemDraftControl(item: Partial<OrdersBasketItemType>): FormControl<Partial<OrdersBasketItemType> | null> {
    return this.formBuilder.nonNullable.control<Partial<OrdersBasketItemType> | null>(
      {
        ...item,
        id: GuidGenerator.newGuid()
      }
    );
  }

  private allItemsAreValidValidator(itemsControl: FormArray<FormControl<Partial<OrdersBasketItemType> | null>>): ValidationErrors | null {
    return itemsControl.controls.every(x => x.valid)
      ? null
      : ({
        invalidItems: true
      });
  }

  private max100PercentValidator(itemsControl: FormArray<FormControl<Partial<OrdersBasketItemType> | null>>): ValidationErrors | null {
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
