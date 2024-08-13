import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AllTradesWidgetComponent } from './widgets/all-trades-widget/all-trades-widget.component';
import { AllTradesComponent } from './components/all-trades/all-trades.component';
import { SharedModule } from "../../shared/shared.module";
import { AllTradesSettingsComponent } from './components/all-trades-settings/all-trades-settings.component';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';

@NgModule({
    declarations: [
        AllTradesWidgetComponent,
        AllTradesComponent,
        AllTradesSettingsComponent
    ],
    exports: [
        AllTradesWidgetComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        NzResizeObserverModule
    ]
})
export class AllTradesModule { }
