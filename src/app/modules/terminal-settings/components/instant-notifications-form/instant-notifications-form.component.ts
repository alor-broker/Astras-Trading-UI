import { Component } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  InstantNotificationsSettings,
  OrdersInstantNotificationType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { ControlValueAccessorBaseComponent } from '../../../../shared/components/control-value-accessor-base/control-value-accessor-base.component';

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
export class InstantNotificationsFormComponent extends ControlValueAccessorBaseComponent<InstantNotificationsSettings> {
  editableNotificationTypes: { value: OrdersInstantNotificationType, enabled: boolean }[] = [];
  currentValue: InstantNotificationsSettings | null = null;
  private isTouched = false;

  constructor() {
    super();
  }

  writeValue(value: InstantNotificationsSettings): void {
    this.currentValue = value;

    this.editableNotificationTypes = Object.values(OrdersInstantNotificationType)
      .map(x => ({
        value: x,
        enabled: !this.currentValue?.hiddenNotifications?.includes(x)
      }));
  }

  toggleNotificationType(notificationType: OrdersInstantNotificationType) {
    const notification = this.editableNotificationTypes.find(x => x.value === notificationType);
    if (notification) {
      notification.enabled = !notification.enabled;
    }

    this.checkIfTouched();
    this.emitValue(
      {
        ...this.currentValue,
        hiddenNotifications: this.editableNotificationTypes.filter(x => !x.enabled).map(x => x.value)
      }
    );
  }

  protected needMarkTouched(): boolean {
    if (!this.isTouched) {
      this.isTouched = true;
      return true;
    }

    return false;
  }
}
