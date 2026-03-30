import { Component, DestroyRef, OnInit, output, inject } from '@angular/core';
import {OrdersBasketSettings} from "../../models/orders-basket-settings.model";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {Observable} from "rxjs";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {FormBuilder, FormsModule, ReactiveFormsModule} from "@angular/forms";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';

@Component({
  selector: 'ats-orders-basket-settings',
  templateUrl: './orders-basket-settings.component.html',
  styleUrls: ['./orders-basket-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
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
  ]
})
export class OrdersBasketSettingsComponent extends WidgetSettingsBaseComponent<OrdersBasketSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly formBuilder = inject(FormBuilder);

  readonly settingsChange = output<void>();

  readonly form = this.formBuilder.group({
    showPresetsPanel: this.formBuilder.nonNullable.control<boolean | null>(false)
  });

  protected settings$!: Observable<OrdersBasketSettings>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  get showCopy(): boolean {
    return true;
  }

  ngOnInit(): void {
    super.ngOnInit();
  }

  protected setCurrentFormValues(settings: OrdersBasketSettings): void {
    this.form.reset();

    this.form.controls.showPresetsPanel.setValue(settings.showPresetsPanel ?? false);
  }

  protected getUpdatedSettings(): Partial<OrdersBasketSettings> {
    return {
      showPresetsPanel: this.form.value.showPresetsPanel ?? false
    };
  }
}
