import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { InstrumentsEffects } from './instruments/instruments.effects';
import * as fromInstruments from './instruments/instruments.reducer';
import * as fromPortfolios from './portfolios/portfolios.reducer';
import * as fromTerminalSettings from './terminal-settings/terminal-settings.reducer';
import * as fromWidgetSettings from './widget-settings/widget-settings.reducer';
import { TerminalSettingsEffects } from './terminal-settings/terminal-settings.effects';
import { WidgetSettingsEffects } from "./widget-settings/widget-settings.effects";
import { WidgetSettingsBridgeEffects } from "./widget-settings/widget-settings-bridge.effects";

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(fromInstruments.instrumentsFeatureKey, fromInstruments.reducer),
    StoreModule.forFeature(fromPortfolios.portfoliosFeatureKey, fromPortfolios.reducer),
    StoreModule.forFeature(fromTerminalSettings.terminalSettingsFeatureKey, fromTerminalSettings.reducer),
    StoreModule.forFeature(fromWidgetSettings.widgetSettingsFeatureKey, fromWidgetSettings.reducer),
    EffectsModule.forFeature([
      InstrumentsEffects,
      TerminalSettingsEffects,
      WidgetSettingsEffects,
      WidgetSettingsBridgeEffects
    ])
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
