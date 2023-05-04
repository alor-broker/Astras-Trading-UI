import { Component, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  InstantNotificationsSettings,
  OrdersInstantNotificationType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';
import { Observable, filter, map } from "rxjs";
import { selectPortfoliosState } from "../../../../store/portfolios/portfolios.selectors";
import { EntityStatus } from "../../../../shared/models/enums/entity-status";
import { Store } from "@ngrx/store";

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
  editableNotificationTypes: { value: OrdersInstantNotificationType, enabled: boolean }[] = [];
  currentValue: InstantNotificationsSettings | null = null;

  excludedPortfolios: string[] = [];
  portfolios$?: Observable<string[]>;

  private isTouched = false;

  constructor(
    private readonly store: Store
  ) {
    super();
  }

  ngOnInit() {
    this.portfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(ps => {
        return Object.values(ps.entities)
          .filter(p => !!p)
          .map(p => (JSON.stringify({ portfolio: p!.portfolio, exchange: p!.exchange })));
      }),
    );
  }

  writeValue(value: InstantNotificationsSettings): void {
    this.currentValue = value;

    this.editableNotificationTypes = Object.values(OrdersInstantNotificationType)
      .map(x => ({
        value: x,
        enabled: !this.currentValue?.hiddenNotifications?.includes(x)
      }));

    this.excludedPortfolios = value.hiddenPortfoliosForNotifications ?? [];
  }

  toggleNotificationType(notificationType: OrdersInstantNotificationType) {
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

  getPortfolioLabel(portfolio: string) {
    const p = JSON.parse(portfolio);
    return `${p.portfolio} (${p.exchange})`;
  }

  excludedPortfoliosChange(portfolios: string[]) {
    this.currentValue = {
      ...this.currentValue,
      hiddenPortfoliosForNotifications: portfolios
    };

    this.checkIfTouched();
    this.emitValue(this.currentValue);
  }

  protected needMarkTouched(): boolean {
    if (!this.isTouched) {
      this.isTouched = true;
      return true;
    }

    return false;
  }
}
