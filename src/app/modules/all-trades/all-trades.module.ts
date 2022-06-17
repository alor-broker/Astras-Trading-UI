import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllTradesWidgetComponent } from './widgets/all-trades-widget/all-trades-widget.component';
import { AllTradesComponent } from './components/all-trades/all-trades.component';
import { SharedModule } from "../../shared/shared.module";



@NgModule({
    declarations: [
        AllTradesWidgetComponent,
        AllTradesComponent
    ],
    exports: [
        AllTradesWidgetComponent
    ],
    imports: [
        CommonModule,
        SharedModule
    ]
})
export class AllTradesModule { }
