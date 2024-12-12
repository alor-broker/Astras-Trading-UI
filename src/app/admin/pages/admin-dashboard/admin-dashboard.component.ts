import {Component, OnInit} from '@angular/core';
import {NzContentComponent, NzHeaderComponent, NzLayoutComponent,} from 'ng-zorro-antd/layout';
import {AdminNavbarComponent} from '../../components/admin-navbar/admin-navbar.component';
import {AdminSettingsBrokerService} from '../../services/settings/admin-settings-broker.service';
import {DashboardModule} from '../../../modules/dashboard/dashboard.module';
import {ACTIONS_CONTEXT, ActionsContext,} from 'src/app/shared/services/actions-context';
import {InstrumentKey} from 'src/app/shared/models/instruments/instrument-key.model';
import {DashboardContextService} from 'src/app/shared/services/dashboard-context.service';
import {TerminalSettingsModule} from "../../../modules/terminal-settings/terminal-settings.module";
import {OrderCommandsModule} from "../../../modules/order-commands/order-commands.module";
import {
  WatchlistCollectionBrokerService
} from "../../../modules/instruments/services/watchlist-collection-broker.service";

@Component({
  selector: 'ats-admin-dashboard',
  standalone: true,
    imports: [
        NzLayoutComponent,
        AdminNavbarComponent,
        NzHeaderComponent,
        NzContentComponent,
        DashboardModule,
        TerminalSettingsModule,
        OrderCommandsModule,
    ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.less',
  providers: [
    {
      provide: ACTIONS_CONTEXT,
      useExisting: AdminDashboardComponent,
    },
  ],
})
export class AdminDashboardComponent implements OnInit, ActionsContext {
  constructor(
    private readonly adminSettingsBrokerService: AdminSettingsBrokerService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly watchlistCollectionBrokerService: WatchlistCollectionBrokerService
  ) {
  }

  ngOnInit(): void {
    this.adminSettingsBrokerService.initSettingsBrokers();
    this.watchlistCollectionBrokerService.setConfig({
      enableStore: false
    });
  }

  instrumentSelected(instrumentKey: InstrumentKey, groupKey: string): void {
    this.dashboardContextService.selectDashboardInstrument(instrumentKey, groupKey);
  }
}
