import { NgModule } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import * as fromInstruments from './instruments/instruments.reducer';
import * as fromPortfolios from './portfolios/portfolios.reducer';

@NgModule({
  declarations: [],
  imports: [
    StoreModule.forFeature(fromInstruments.instrumentsFeatureKey, fromInstruments.reducer),
    StoreModule.forFeature(fromPortfolios.portfoliosFeatureKey, fromPortfolios.reducer),
  ],
  exports: [],
  providers: [],
})

export class AtsStoreModule {
}
