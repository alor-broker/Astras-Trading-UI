import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PositionsTableRoutingModule } from './positions-table-routing.module';
import { PositionsTableComponent } from './components/positions-table/positions-table.component';
import { PositionsTablePageComponent } from './pages/positions-table-page/positions-table-page.component';


@NgModule({
  declarations: [
    PositionsTableComponent,
    PositionsTablePageComponent
  ],
  imports: [
    CommonModule,
    PositionsTableRoutingModule
  ]
})
export class PositionsTableModule { }
