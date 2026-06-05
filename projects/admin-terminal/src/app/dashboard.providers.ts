import {Provider} from '@angular/core';
import {TerminalDashboardProvidersBuilder} from '@terminal-core-lib/terminal-providers/terminal-dashboard-providers.builder';
import {provideTerminalOrderCommandService} from '@terminal-core-lib/terminal-providers/terminal-dashboard-orders.providers';
import {provideScalperOrderBookSharedServices} from '@terminal-widgets-lib/widgets/scalper-order-book/scalper-order-book.providers';
import {provideBlotterSharedServices} from '@terminal-widgets-lib/widgets/blotter/blotter.providers';
import {environment} from '../environments/environment';
import {provideAdminWidgetRegistry} from './widget-registry';
import {AdminOrderCommandService} from './services/admin-order-command.service';

export const dashboardProviders: Provider[] = new TerminalDashboardProvidersBuilder({
  apiUrl: environment.apiUrl
})
  .withProvider(
    provideTerminalOrderCommandService(AdminOrderCommandService),
    provideAdminWidgetRegistry(),
    provideScalperOrderBookSharedServices(),
    provideBlotterSharedServices()
  )
  .build();
