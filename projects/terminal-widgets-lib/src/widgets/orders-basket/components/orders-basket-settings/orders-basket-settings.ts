import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  ReactiveFormsModule
} from "@angular/forms";
import {TranslocoDirective} from '@jsverse/transloco';
import {OrdersBasketWidgetSettings} from '@terminal-widgets-lib/widgets/orders-basket/widget-settings.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';

@Component({
  selector: 'ats-orders-basket-settings',
  templateUrl: './orders-basket-settings.html',
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsForm,
    WidgetSettingsSwitch,
    TranslocoDirective,
    ReactiveFormsModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrdersBasketSettings extends WidgetSettingsBase<OrdersBasketWidgetSettings> {
  readonly widgetInstance = input.required<WidgetInstance>();

  protected settings$!: Observable<OrdersBasketWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    showPresetsPanel: this.formBuilder.nonNullable.control(false)
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  protected setCurrentFormValues(settings: OrdersBasketWidgetSettings): void {
    this.form.reset();

    this.form.controls.showPresetsPanel.setValue(settings.showPresetsPanel ?? false);
  }

  protected getUpdatedSettings(): Partial<OrdersBasketWidgetSettings> {
    return {
      showPresetsPanel: this.form.value.showPresetsPanel ?? false
    };
  }
}
