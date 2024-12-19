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
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { LetDirective } from "@ngrx/component";
import { ExportWatchlistDialogComponent } from './components/export-watchlist-dialog/export-watchlist-dialog.component';
import { ImportWatchlistDialogComponent } from './components/import-watchlist-dialog/import-watchlist-dialog.component';
import { NzSpinModule } from "ng-zorro-antd/spin";
import { NzUploadModule } from "ng-zorro-antd/upload";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { AddToWatchlistMenuComponent } from "./widgets/add-to-watchlist-menu/add-to-watchlist-menu.component";
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";
import { TableRowHeightDirective } from "../../shared/directives/table-row-height.directive";

@NgModule({
  declarations: [
    InstrumentSelectComponent,
    InstrumentSelectWidgetComponent,
    InstrumentSelectSettingsComponent,
    WatchlistTableComponent,
    WatchlistCollectionEditComponent,
    ExportWatchlistDialogComponent,
    ImportWatchlistDialogComponent,
    AddToWatchlistMenuComponent
  ],
    imports: [
        SharedModule,
        InstrumentsRoutingModule,
        NzListModule,
        NzInputModule,
        NzResizeObserverModule,
        LetDirective,
        NzSpinModule,
        NzUploadModule,
        DragDropModule,
        WidgetSettingsComponent,
        TableRowHeightDirective
    ],
  exports: [
    InstrumentSelectWidgetComponent,
    AddToWatchlistMenuComponent
  ]
})
export class InstrumentsModule { }
