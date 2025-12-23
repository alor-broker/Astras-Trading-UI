import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import {take} from "rxjs";
import {defaultBadgeColor, toInstrumentKey} from "../../../../shared/utils/instruments";
import {OrderFormType} from "../../../../shared/models/orders/orders-dialog.model";
import {OrdersDialogService} from "../../../../shared/services/orders/orders-dialog.service";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {filter, map} from "rxjs/operators";

@Component({
    selector: 'ats-open-orders-dialog-nav-btn',
    imports: [
        TranslocoDirective,
        NzButtonComponent,
        NzIconDirective
    ],
    templateUrl: './open-orders-dialog-nav-btn.component.html',
    styleUrl: './open-orders-dialog-nav-btn.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OpenOrdersDialogNavBtnComponent {
  private readonly ordersDialogService = inject(OrdersDialogService);
  private readonly dashboardContextService = inject(DashboardContextService);

  readonly atsDisabled = input(false);

  openDialog(): void {
    this.dashboardContextService.selectedDashboard$.pipe(
      filter(d => d.selectedPortfolio != null && d.instrumentsSelection != null),
      map(d => d.instrumentsSelection![defaultBadgeColor]),
      take(1)
    ).subscribe(activeInstrument => {
      if (activeInstrument == null) {
        throw new Error('Instrument is not selected');
      }

      this.ordersDialogService.openNewOrderDialog({
        instrumentKey: toInstrumentKey(activeInstrument),
        initialValues: {
          orderType: OrderFormType.Limit,
          quantity: 1
        }
      });
    });
  }
}
