import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {Observable} from "rxjs";
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule
} from "@angular/forms";
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
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {OrdersBasketWidgetSettings} from '@terminal-widgets-lib/widgets/orders-basket/widget-settings.types';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';

@Component({
  selector: 'ats-orders-basket-settings',
  templateUrl: './orders-basket-settings.html',
  imports: [
    WidgetSettings,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSwitchComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrdersBasketSettings extends WidgetSettingsBase<OrdersBasketWidgetSettings> implements OnInit {
  protected settings$!: Observable<OrdersBasketWidgetSettings>;

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    showPresetsPanel: this.formBuilder.nonNullable.control<boolean | null>(false)
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
