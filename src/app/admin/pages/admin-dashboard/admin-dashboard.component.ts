import { Component, OnInit, inject } from '@angular/core';
import {NzContentComponent, NzHeaderComponent, NzLayoutComponent,} from 'ng-zorro-antd/layout';
import {AdminNavbarComponent} from '../../components/admin-navbar/admin-navbar.component';
import {AdminSettingsBrokerService} from '../../services/settings/admin-settings-broker.service';
import {ACTIONS_CONTEXT, ActionsContext,} from 'src/app/shared/services/actions-context';
import {InstrumentKey} from 'src/app/shared/models/instruments/instrument-key.model';
import {DashboardContextService} from 'src/app/shared/services/dashboard-context.service';
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";
import { InstrumentSelectDialogWidgetComponent } from "../../../modules/instruments/widgets/instrument-select-dialog-widget/instrument-select-dialog-widget.component";
import {GraphStorageService} from "../../../modules/ai-graph/services/graph-storage.service";
import {DashboardComponent} from "../../../modules/dashboard/components/dashboard/dashboard.component";
import {
  OrdersDialogWidgetComponent
} from "../../../modules/order-commands/widgets/orders-dialog-widget/orders-dialog-widget.component";
import {
  EditOrderDialogWidgetComponent
} from "../../../modules/order-commands/widgets/edit-order-dialog-widget/edit-order-dialog-widget.component";

@Component({
    selector: 'ats-admin-dashboard',
  imports: [
    NzLayoutComponent,
    AdminNavbarComponent,
    NzHeaderComponent,
    NzContentComponent,
    InstrumentSelectDialogWidgetComponent,
    DashboardComponent,
    OrdersDialogWidgetComponent,
    EditOrderDialogWidgetComponent,
  ],
    templateUrl: './admin-dashboard.component.html',
    styleUrl: './admin-dashboard.component.less',
    providers: [
        {
            provide: ACTIONS_CONTEXT,
            useExisting: AdminDashboardComponent,
        },
    ]
})
export class AdminDashboardComponent implements OnInit, ActionsContext {
  private readonly adminSettingsBrokerService = inject(AdminSettingsBrokerService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly watchlistCollectionBrokerService = inject(WatchlistCollectionBrokerService);
  private readonly graphStorageService = inject(GraphStorageService);

  ngOnInit(): void {
    this.adminSettingsBrokerService.initSettingsBrokers();
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: false
    });
    this.graphStorageService.setConfig({
      storageType: 'local'
    });
  }

  selectInstrument(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }
}
