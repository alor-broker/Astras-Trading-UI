import { Component, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  InstantNotificationsSettings,
  OrdersInstantNotificationType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { Observable, filter, map } from "rxjs";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { isPortfoliosEqual } from "../../../../shared/utils/portfolios";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";

@Component({
  selector: 'ats-instant-notifications-form',
  templateUrl: './instant-notifications-form.component.html',
  styleUrls: ['./instant-notifications-form.component.less'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: InstantNotificationsFormComponent
    }
  ]
})
export class InstantNotificationsFormComponent
extends ControlValueAccessorBaseComponent<InstantNotificationsSettings>
implements OnInit {
  private readonly nonSwitchableNotifications = [
    OrdersInstantNotificationType.OrderSubmitFailed,
    OrdersInstantNotificationType.OrderUpdateFailed,
    OrdersInstantNotificationType.OrderCancelFailed
  ];

  editableNotificationTypes: { value: OrdersInstantNotificationType, enabled: boolean }[] = [];
  currentValue: InstantNotificationsSettings | null = null;

  excludedPortfolios: PortfolioKey[] = [];
  portfolios$?: Observable<PortfolioKey[]>;

  private isTouched = false;

  constructor(
    private readonly store: Store
  ) {
    super();
  }

  ngOnInit(): void {
    this.portfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(ps => {
        return Object.values(ps.entities)
          .filter(p => !!p)
          .map(p => ({ portfolio: p!.portfolio, exchange: p!.exchange }));
      }),
    );
  }

  writeValue(value: InstantNotificationsSettings): void {
    this.currentValue = value;

    this.editableNotificationTypes = Object.values(OrdersInstantNotificationType)
      .filter(x => !this.nonSwitchableNotifications.includes(x))
      .map(x => ({
        value: x,
        enabled: !(this.currentValue?.hiddenNotifications?.includes(x) ?? false)
      }));

    this.excludedPortfolios = value.hiddenPortfoliosForNotifications ?? [];
  }

  toggleNotificationType(notificationType: OrdersInstantNotificationType): void {
    const notification = this.editableNotificationTypes.find(x => x.value === notificationType);
    if (notification) {
      notification.enabled = !notification.enabled;
    }

    this.currentValue = {
      ...this.currentValue,
      hiddenNotifications: this.editableNotificationTypes.filter(x => !x.enabled).map(x => x.value)
    };

    this.checkIfTouched();
    this.emitValue(this.currentValue);
  }

  excludedPortfoliosChange(portfolios: PortfolioKey[]): void {
    this.currentValue = {
      ...this.currentValue,
      hiddenPortfoliosForNotifications: portfolios
    };

    this.checkIfTouched();
    this.emitValue(this.currentValue);
  }

  compareFn = (op1?: PortfolioKey, op2?: PortfolioKey): boolean => {
    return !!op1 && !!op2 && isPortfoliosEqual(op1, op2);
  };

  protected needMarkTouched(): boolean {
    if (!this.isTouched) {
      this.isTouched = true;
      return true;
    }

    return false;
  }
}
