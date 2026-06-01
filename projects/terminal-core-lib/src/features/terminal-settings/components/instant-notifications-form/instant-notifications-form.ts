import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormsModule,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import {ControlValueAccessorBase} from '../../../forms/components/control-value-accessor-base';
import {
  InstantNotificationsSettings,
  OrdersInstantNotificationType
} from '../../terminal-settings.types';
import {PortfolioKey} from '../../../../common/types/portfolio.types';
import {
  map,
  Observable
} from 'rxjs';
import {PortfoliosStoreFacade} from '../../../portfolios/store/portfolios-store-facade';
import {PortfolioKeyEqualityComparer} from '../../../../common/utils/portfolio-key.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {AsyncPipe} from '@angular/common';
import {
  NzFormControlComponent,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {
  NzOptionComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';

@Component({
  selector: 'ats-instant-notifications-form',
  imports: [
    TranslocoDirective,
    NzSwitchComponent,
    FormsModule,
    NzDividerComponent,
    AsyncPipe,
    NzFormItemComponent,
    NzIconDirective,
    NzTooltipDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzSelectComponent,
    NzOptionComponent
  ],
  templateUrl: './instant-notifications-form.html',
  styleUrl: './instant-notifications-form.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => InstantNotificationsForm),
    }
  ],
})
export class InstantNotificationsForm extends ControlValueAccessorBase<InstantNotificationsSettings> implements OnInit {
  editableNotificationTypes: { value: OrdersInstantNotificationType, enabled: boolean }[] = [];

  currentValue: InstantNotificationsSettings | null = null;

  excludedPortfolios: PortfolioKey[] = [];

  portfolios$?: Observable<PortfolioKey[]>;

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly nonSwitchableNotifications = [
    OrdersInstantNotificationType.OrderSubmitFailed,
    OrdersInstantNotificationType.OrderUpdateFailed,
    OrdersInstantNotificationType.OrderCancelFailed,
    OrdersInstantNotificationType.OrdersGroupUnsupported
  ];

  private isTouched = false;

  ngOnInit(): void {
    this.portfolios$ = this.portfoliosStoreFacade.portfolios$.pipe(
      map(ps => {
        return ps.map(p => ({portfolio: p.portfolio, exchange: p.exchange}));
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
    return !!op1 && !!op2 && PortfolioKeyEqualityComparer.equals(op1, op2);
  };

  protected needMarkTouched(): boolean {
    if (!this.isTouched) {
      this.isTouched = true;
      return true;
    }

    return false;
  }
}
