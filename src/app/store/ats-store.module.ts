import { NgModule } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { InstrumentsEffects } from './instruments/instruments.effects';
import * as fromInstruments from './instruments/instruments.reducer';
import * as fromPortfolios from './portfolios/portfolios.reducer';

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(fromInstruments.instrumentsFeatureKey, fromInstruments.reducer),
    StoreModule.forFeature(fromPortfolios.portfoliosFeatureKey, fromPortfolios.reducer),
    EffectsModule.forFeature([InstrumentsEffects])
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
