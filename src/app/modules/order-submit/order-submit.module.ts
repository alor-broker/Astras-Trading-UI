import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderSubmitWidgetComponent } from './widgets/order-submit-widget/order-submit-widget.component';
import { OrderSubmitSettingsComponent } from './components/order-submit-settings/order-submit-settings.component';
import { NzFormModule } from "ng-zorro-antd/form";
import { NzSelectModule } from "ng-zorro-antd/select";
import { NzCollapseModule } from "ng-zorro-antd/collapse";
import { NzWaveModule } from "ng-zorro-antd/core/wave";
import { ReactiveFormsModule } from "@angular/forms";
import { NzInputModule } from "ng-zorro-antd/input";
import { NzButtonModule } from "ng-zorro-antd/button";
import { OrderSubmitComponent } from './components/order-submit/order-submit.component';
import { LimitOrderFormComponent } from "./components/order-forms/limit-order-form/limit-order-form.component";
import { NzTabsModule } from "ng-zorro-antd/tabs";
import { SharedModule } from "../../shared/shared.module";
import { CommandModule } from "../command/command.module";
import { MarketOrderFormComponent } from './components/order-forms/market-order-form/market-order-form.component';
import { StopOrderFormComponent } from './components/order-forms/stop-order-form/stop-order-form.component';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { LimitOrderPriceChangeComponent } from './components/limit-order-price-change/limit-order-price-change.component';
import { WorkingVolumesComponent } from './components/working-volumes/working-volumes.component';
import {PushNotificationsModule} from "../push-notifications/push-notifications.module";


@NgModule({
  declarations: [
    OrderSubmitWidgetComponent,
    OrderSubmitSettingsComponent,
    OrderSubmitComponent,
    LimitOrderFormComponent,
    MarketOrderFormComponent,
    StopOrderFormComponent,
    LimitOrderPriceChangeComponent,
    WorkingVolumesComponent
  ],
  imports: [
    CommonModule,
    NzFormModule,
    NzSelectModule,
    NzCollapseModule,
    NzWaveModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule,
    NzTabsModule,
    SharedModule,
    CommandModule,
    NzInputNumberModule,
    PushNotificationsModule
  ],
  exports: [OrderSubmitWidgetComponent]
})
export class OrderSubmitModule {
}
