import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { PortfoliosFeature } from './portfolios/portfolios.reducer';
import { TerminalSettingsFeature } from './terminal-settings/terminal-settings.reducer';
import { TerminalSettingsEffects } from './terminal-settings/terminal-settings.effects';
import { WidgetSettingsEffects } from "./widget-settings/widget-settings.effects";
import { WidgetSettingsBridgeEffects } from "./widget-settings/widget-settings-bridge.effects";
import { PortfoliosEffects } from './portfolios/portfolios.effects';
import { DashboardsEffects } from './dashboards/dashboards.effects';
import { DashboardsBridgeEffects } from './dashboards/dashboards-bridge.effects';
import { MobileDashboardEffects } from "./mobile-dashboard/mobile-dashboard.effects";
import { TerminalSettingsBridgeEffects } from "./terminal-settings/terminal-settings-bridge.effects";
import { WidgetsLocalStateEffects } from "./widgets-local-state/widgets-local-state.effects";
import { WidgetsLocalStateBridgeEffects } from "./widgets-local-state/widgets-local-state-bridge.effects";
import { WidgetsLocalStatesFeature } from "./widgets-local-state/widgets-local-state.reducer";
import { WidgetSettingsFeature } from "./widget-settings/widget-settings.reducer";
import { DashboardsFeature } from "./dashboards/dashboards.reducer";
import { MobileDashboardFeature } from "./mobile-dashboard/mobile-dashboard.reducer";

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(PortfoliosFeature),
    StoreModule.forFeature(TerminalSettingsFeature),
    StoreModule.forFeature(WidgetSettingsFeature),
    StoreModule.forFeature(WidgetsLocalStatesFeature),
    StoreModule.forFeature(DashboardsFeature),
    StoreModule.forFeature(MobileDashboardFeature),
    EffectsModule.forFeature([
      PortfoliosEffects,
      TerminalSettingsEffects,
      TerminalSettingsBridgeEffects,
      WidgetSettingsEffects,
      WidgetSettingsBridgeEffects,
      WidgetsLocalStateEffects,
      WidgetsLocalStateBridgeEffects,
      DashboardsEffects,
      DashboardsBridgeEffects,
      MobileDashboardEffects,

    ])
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
