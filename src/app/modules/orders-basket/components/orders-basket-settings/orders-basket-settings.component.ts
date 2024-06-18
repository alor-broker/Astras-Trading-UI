import {
  Component,
  DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { OrdersBasketSettings } from "../../models/orders-basket-settings.model";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { Observable } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";
import { FormBuilder } from "@angular/forms";

@Component({
  selector: 'ats-orders-basket-settings',
  templateUrl: './orders-basket-settings.component.html',
  styleUrls: ['./orders-basket-settings.component.less']
})
export class OrdersBasketSettingsComponent extends WidgetSettingsBaseComponent<OrdersBasketSettings> implements OnInit {
  @Input({ required: true })
  guid!: string;

  @Output()
  settingsChange = new EventEmitter<void>();

  readonly form = this.formBuilder.group({
    showPresetsPanel: this.formBuilder.nonNullable.control<boolean | null>(false)
  });

  protected settings$!: Observable<OrdersBasketSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    protected readonly destroyRef: DestroyRef,
    private readonly formBuilder: FormBuilder,
  ) {
    super(settingsService, manageDashboardsService, destroyRef);
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
