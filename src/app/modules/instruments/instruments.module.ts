import { NgModule } from '@angular/core';

import { InstrumentsRoutingModule } from './instruments-routing.module';
import { InstrumentSelectComponent } from './components/instrument-select/instrument-select.component';
import { InstrumentSelectWidgetComponent } from './widgets/instrument-select-widget/instrument-select-widget.component';
import { InstrumentSelectSettingsComponent } from './components/instrument-select-settings/instrument-select-settings.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { WatchlistTableComponent } from './components/watchlist-table/watchlist-table.component';
import { WatchlistCollectionEditComponent } from './components/watchlist-collection-edit/watchlist-collection-edit.component';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzInputModule } from 'ng-zorro-antd/input';


@NgModule({
  declarations: [
    InstrumentSelectComponent,
    InstrumentSelectWidgetComponent,
    InstrumentSelectSettingsComponent,
    WatchlistTableComponent,
    WatchlistCollectionEditComponent
  ],
    imports: [
        SharedModule,
        InstrumentsRoutingModule,
        NzListModule,
        NzInputModule
    ],
  exports: [
    InstrumentSelectWidgetComponent
  ]
})
export class InstrumentsModule { }
