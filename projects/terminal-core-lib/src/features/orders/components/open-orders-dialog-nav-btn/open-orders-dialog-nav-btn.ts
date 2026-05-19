import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation
} from '@angular/core';
import {OrdersDialogService} from '../../services/orders-dialog.service';
import {
  filter,
  map,
  take
} from "rxjs";
import {DefaultBadge} from '../../../instruments/constants/badges.constants';
import {InstrumentKeyHelper} from '../../../../common/utils/instrument-key.helper';
import {OrderFormType} from '../../services/orders-dialog-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {DASHBOARD_CONTEXT_SERVICE} from '../../../dashboard/services/dashboard-context-service.types';

@Component({
  selector: 'ats-open-orders-dialog-nav-btn',
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective
  ],
  templateUrl: './open-orders-dialog-nav-btn.html',
  styleUrl: './open-orders-dialog-nav-btn.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OpenOrdersDialogNavBtn {
  readonly atsDisabled = input(false);

  private readonly ordersDialogService = inject(OrdersDialogService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected openDialog(): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => d.selectedPortfolio != null && d.instrumentsSelection != null),
      map(d => d.instrumentsSelection![DefaultBadge]),
      take(1)
    ).subscribe(activeInstrument => {
      if (activeInstrument == null) {
        throw new Error('Instrument is not selected');
      }

      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: InstrumentKeyHelper.toInstrumentKey(activeInstrument),
        initialValues: {
          orderType: OrderFormType.Limit,
          quantity: 1
        }
      });
    });
  }
}
