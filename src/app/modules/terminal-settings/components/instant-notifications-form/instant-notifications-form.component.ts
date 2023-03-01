import { Component } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {
  InstantNotificationsSettings,
  OrdersInstantNotificationType
} from '../../../../shared/models/terminal-settings/terminal-settings.model';

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
export class InstantNotificationsFormComponent implements ControlValueAccessor {
  editableNotificationTypes: { value: OrdersInstantNotificationType, enabled: boolean }[] = [];
  currentValue: InstantNotificationsSettings | null = null;

  private isTouched = false;

  registerOnChange(fn: (value: InstantNotificationsSettings) => void): void {
    this.onValueChanged = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
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

    this.markTouched();
    this.emitValue();
  }

  private onTouched = () => {
  };

  private markTouched() {
    if (!this.isTouched) {
      this.isTouched = true;
      this.onTouched();
    }
  }

  private emitValue() {
    this.onValueChanged({
      ...this.currentValue,
      hiddenNotifications: this.editableNotificationTypes.filter(x => !x.enabled).map(x => x.value)
    });
  }

  private onValueChanged: (value: InstantNotificationsSettings) => void = () => {
  };
}
