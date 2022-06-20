import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { InstrumentsEffects } from './instruments/instruments.effects';
import * as fromInstruments from './instruments/instruments.reducer';
import * as fromPortfolios from './portfolios/portfolios.reducer';
import * as fromTerminalSettings from './terminal-settings/terminal-settings.reducer';
import { TerminalSettingsEffects } from './terminal-settings/terminal-settings.effects';

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(fromInstruments.instrumentsFeatureKey, fromInstruments.reducer),
    StoreModule.forFeature(fromPortfolios.portfoliosFeatureKey, fromPortfolios.reducer),
    StoreModule.forFeature(fromTerminalSettings.terminalSettingsFeatureKey, fromTerminalSettings.reducer),
    EffectsModule.forFeature([InstrumentsEffects, TerminalSettingsEffects])
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
