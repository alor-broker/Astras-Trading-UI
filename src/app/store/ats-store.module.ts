import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import * as fromPortfolios from './portfolios/portfolios.reducer';
import * as fromTerminalSettings from './terminal-settings/terminal-settings.reducer';
import * as fromWidgetSettings from './widget-settings/widget-settings.reducer';
import * as fromDashboards from './dashboards/dashboards.reducer';
import * as fromMobileDashboard from './mobile-dashboard/mobile-dashboard.reducer';
import { TerminalSettingsEffects } from './terminal-settings/terminal-settings.effects';
import { WidgetSettingsEffects } from "./widget-settings/widget-settings.effects";
import { WidgetSettingsBridgeEffects } from "./widget-settings/widget-settings-bridge.effects";
import { PortfoliosEffects } from './portfolios/portfolios.effects';
import { DashboardsEffects } from './dashboards/dashboards.effects';
import { DashboardsBridgeEffects } from './dashboards/dashboards-bridge.effects';
import { MobileDashboardEffects } from "./mobile-dashboard/mobile-dashboard.effects";

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(fromPortfolios.portfoliosFeatureKey, fromPortfolios.reducer),
    StoreModule.forFeature(fromTerminalSettings.terminalSettingsFeatureKey, fromTerminalSettings.reducer),
    StoreModule.forFeature(fromWidgetSettings.widgetSettingsFeatureKey, fromWidgetSettings.reducer),
    StoreModule.forFeature(fromDashboards.dashboardsFeatureKey, fromDashboards.reducer),
    StoreModule.forFeature(fromMobileDashboard.mobileDashboardFeatureKey, fromMobileDashboard.reducer),
    EffectsModule.forFeature([
      PortfoliosEffects,
      TerminalSettingsEffects,
      WidgetSettingsEffects,
      WidgetSettingsBridgeEffects,
      DashboardsEffects,
      DashboardsBridgeEffects,
      MobileDashboardEffects
    ])
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
