import {afterNextRender, ChangeDetectionStrategy, Component, ElementRef, inject, Injector, input, signal, viewChild, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';
import {Observable, take} from 'rxjs';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzListModule} from 'ng-zorro-antd/list';
import {NzOptionComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {InstrumentEqualityComparer, InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {InlineInstrumentSearch} from '@terminal-core-lib/features/instruments/components/inline-instrument-search/inline-instrument-search';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {DEFAULT_RIBBON_ITEMS, RIBBON_REFRESH_INTERVAL, RibbonItem, RibbonLayout, RibbonWidgetSettings} from '../../widget-settings.types';
import {NzSliderComponent} from 'ng-zorro-antd/slider';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';

interface RibbonItemEditor {
  instrument: RibbonItem;
  displayName: FormControl<string>;
}

@Component({
  selector: 'ats-ribbon-settings',
  templateUrl: './ribbon-settings.html',
  styleUrl: './ribbon-settings.less',
  imports: [WidgetSettingsEditor, TranslocoDirective, ReactiveFormsModule, InlineInstrumentSearch,
    NzButtonComponent, NzCheckboxComponent, NzIconDirective, NzInputDirective, NzSelectComponent, NzOptionComponent,
    NzListModule, NzSliderComponent, WidgetSettingsGroup, WidgetSettingsForm, WidgetSettingsFormItem],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class RibbonSettings extends WidgetSettingsBase<RibbonWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();
  readonly validationOptions = RIBBON_REFRESH_INTERVAL;
  readonly layouts = RibbonLayout;
  readonly appearanceForm = new FormGroup({
    layout: new FormControl(RibbonLayout.SingleRow, {nonNullable: true, validators: [Validators.required]})
  });

  readonly refreshForm = new FormGroup({
    refreshIntervalSec: new FormControl<number>(RIBBON_REFRESH_INTERVAL.defaultValue, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(RIBBON_REFRESH_INTERVAL.min), Validators.max(RIBBON_REFRESH_INTERVAL.max)]
    })
  });

  readonly refreshMarks = {
    [RIBBON_REFRESH_INTERVAL.min]: String(RIBBON_REFRESH_INTERVAL.min),
    [RIBBON_REFRESH_INTERVAL.max]: String(RIBBON_REFRESH_INTERVAL.max)
  };

  override get canSave(): boolean {
    return this.refreshForm.valid && this.appearanceForm.valid;
  }

  readonly isFuturesControl = new FormControl(false, {nonNullable: true});
  readonly isFutures = toSignal(this.isFuturesControl.valueChanges, {initialValue: this.isFuturesControl.value});
  readonly searchControl = new FormControl<InstrumentKey | null>(null);
  readonly futuresCode = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9]*$/)]
  });

  readonly items = signal<RibbonItemEditor[]>([]);
  readonly movedItem = signal<RibbonItemEditor | null>(null);
  readonly moveDirection = signal(0);
  private moveHighlightTimeout: ReturnType<typeof setTimeout> | null = null;
  readonly nameEdit = signal<{item: RibbonItemEditor, original: string} | null>(null);
  private readonly nameInput = viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly injector = inject(Injector);

  startNameEdit(item: RibbonItemEditor): void {
    this.nameEdit.set({item, original: item.displayName.value});
    afterNextRender(() => {
      const input = this.nameInput()?.nativeElement;
      input?.focus();
      input?.select();
    }, {injector: this.injector});
  }

  finishNameEdit(cancel = false): void {
    const edit = this.nameEdit();
    if (cancel && edit != null) {
      edit.item.displayName.setValue(edit.original);
    }
    this.nameEdit.set(null);
  }

  readonly duplicate = signal(false);
  readonly exchanges = signal<string[]>([]);
  readonly exchangeControl = new FormControl<string | null>(null, Validators.required);
  private readonly marketService = inject(MarketService);
  protected settings$!: Observable<RibbonWidgetSettings>;

  override ngOnInit(): void {
    this.destroyRef.onDestroy(() => {
      if (this.moveHighlightTimeout != null) {
        clearTimeout(this.moveHighlightTimeout);
      }
    });
    super.ngOnInit();
    this.marketService.getMarketSettings().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.exchanges.set(settings.exchanges.map(item => item.exchange));
      const selected = settings.exchanges.length === 1
        ? settings.exchanges[0]
        : settings.exchanges.find(item => item.settings.isDefault === true);
      this.exchangeControl.setValue(selected?.exchange ?? null);
    });
  }

  addInstrument(instrument: InstrumentKey | null): void {
    if (instrument == null) {
      return;
    }

    this.addItem(InstrumentKeyHelper.toInstrumentKey(instrument));
    this.searchControl.reset();
  }

  addFutures(): void {
    const exchange = this.exchangeControl.value;
    if (exchange == null || !this.exchanges().includes(exchange)) {
      this.exchangeControl.markAsTouched();
      return;
    }

    this.futuresCode.setValue(this.futuresCode.value.trim());
    if (this.futuresCode.invalid) {
      this.futuresCode.markAsTouched();
      return;
    }

    if (this.addItem({symbol: this.futuresCode.value, exchange, isFutures: true})) {
      this.futuresCode.reset();
    }
  }

  moveItem(index: number, offset: number): void {
    const target = index + offset;
    if (index < 0 || index >= this.items().length || target < 0 || target >= this.items().length || target === index) {
      return;
    }

    this.movedItem.set(this.items()[index]);
    this.moveDirection.set(offset);
    if (this.moveHighlightTimeout != null) {
      clearTimeout(this.moveHighlightTimeout);
    }
    this.moveHighlightTimeout = setTimeout(() => {
      this.movedItem.set(null);
      this.moveHighlightTimeout = null;
    }, 1500);

    this.items.update(items => {
      const updated = [...items];
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  }

  removeItem(index: number): void {
    this.items.update(items => items.filter((item, itemIndex) => itemIndex !== index));
    this.duplicate.set(false);
  }

  restoreDefaults(): void {
    this.setItems(DEFAULT_RIBBON_ITEMS);
  }

  protected getUpdatedSettings(): Partial<RibbonWidgetSettings> {
    return {
      refreshIntervalSec: this.refreshForm.controls.refreshIntervalSec.value,
      layout: this.appearanceForm.controls.layout.value,
      displayItems: this.items().map(item => ({
        ...item.instrument,
        displayName: item.displayName.value.trim() || undefined
      }))
    };
  }

  protected setCurrentFormValues(settings: RibbonWidgetSettings): void {
    this.appearanceForm.controls.layout.setValue(settings.layout ?? RibbonLayout.SingleRow);
    this.refreshForm.controls.refreshIntervalSec.setValue(settings.refreshIntervalSec ?? RIBBON_REFRESH_INTERVAL.defaultValue);
    this.setItems(settings.displayItems ?? DEFAULT_RIBBON_ITEMS);
  }

  private setItems(items: readonly RibbonItem[]): void {
    this.movedItem.set(null);
    this.items.set(items.map(item => this.createItemEditor(item)));
    this.duplicate.set(false);
  }

  private addItem(instrument: RibbonItem): boolean {
    const exists = this.items().some(item =>
      InstrumentEqualityComparer.equals(item.instrument, instrument)
      && (item.instrument.isFutures ?? false) === (instrument.isFutures ?? false)
    );
    this.duplicate.set(exists);
    if (exists) {
      return false;
    }

    this.items.update(items => [...items, this.createItemEditor(instrument)]);
    return true;
  }

  private createItemEditor(instrument: RibbonItem): RibbonItemEditor {
    return {
      instrument: {...instrument},
      displayName: new FormControl(instrument.displayName ?? '', {nonNullable: true})
    };
  }
}
