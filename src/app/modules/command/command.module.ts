import { NgModule } from '@angular/core';

import { CommandRoutingModule } from './command-routing.module';
import { LimitCommandComponent } from './components/limit-command/limit-command.component';
import { CommandWidgetComponent } from './widgets/command-widget/command-widget.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { CommandHeaderComponent } from './components/command-header/command-header.component';
import { CommandFooterComponent } from './components/command-footer/command-footer.component';
import { MarketCommandComponent } from './components/market-command/market-command.component';
import { EvaluationComponent } from './components/evaluation/evaluation.component';
import { EditWidgetComponent } from './widgets/edit-widget/edit-widget.component';
import { LimitEditComponent } from './components/limit-edit/limit-edit.component';
import { StopCommandComponent } from './components/stop-command/stop-command.component';
import { StopEditComponent } from './components/stop-edit/stop-edit.component';
import { NzInputModule } from "ng-zorro-antd/input";


@NgModule({
  declarations: [
    LimitCommandComponent,
    LimitEditComponent,
    StopCommandComponent,
    CommandWidgetComponent,
    EditWidgetComponent,
    CommandHeaderComponent,
    CommandFooterComponent,
    MarketCommandComponent,
    EvaluationComponent,
    StopEditComponent
  ],
  imports: [
    SharedModule,
    CommandRoutingModule,
    NzInputModule
  ],
  exports: [
    CommandWidgetComponent,
    EditWidgetComponent,
    EvaluationComponent
  ]
})
export class CommandModule { }
