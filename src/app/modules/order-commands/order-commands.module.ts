import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrdersDialogWidgetComponent } from './widgets/orders-dialog-widget/orders-dialog-widget.component';
import { CompactHeaderComponent } from './components/compact-header/compact-header.component';
import { InstrumentInfoComponent } from './components/instrument-info/instrument-info.component';
import { OrderEvaluationComponent } from './components/order-evaluation/order-evaluation.component';
import { LimitOrderFormComponent } from './components/order-forms/limit-order-form/limit-order-form.component';
import { MarketOrderFormComponent } from './components/order-forms/market-order-form/market-order-form.component';
import { StopOrderFormComponent } from './components/order-forms/stop-order-form/stop-order-form.component';
import { TranslocoModule } from "@jsverse/transloco";
import { NzModalModule } from "ng-zorro-antd/modal";
import { NzButtonModule } from "ng-zorro-antd/button";
import { NzIconModule } from "ng-zorro-antd/icon";
import { NzWaveModule } from "ng-zorro-antd/core/wave";
import { NzTypographyModule } from "ng-zorro-antd/typography";
import { NzDescriptionsModule } from "ng-zorro-antd/descriptions";
import { NzBadgeModule } from "ng-zorro-antd/badge";
import { NzAvatarModule } from "ng-zorro-antd/avatar";
import { EditOrderDialogWidgetComponent } from './widgets/edit-order-dialog-widget/edit-order-dialog-widget.component';
import { NzTabsModule } from "ng-zorro-antd/tabs";
import { PushNotificationsModule } from "../push-notifications/push-notifications.module";
import { NzFormModule } from "ng-zorro-antd/form";
import { ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../../shared/shared.module";
import { OrderSubmitWidgetComponent } from './widgets/order-submit-widget/order-submit-widget.component';
import { OrderSubmitSettingsComponent } from "./components/order-submit-settings/order-submit-settings.component";
import { NzInputNumberLegacyModule } from "ng-zorro-antd/input-number-legacy";
import { WorkingVolumesComponent } from "./components/working-volumes/working-volumes.component";
import {
  LimitOrderPriceChangeComponent
} from "./components/limit-order-price-change/limit-order-price-change.component";
import {
  EditLimitOrderFormComponent
} from './components/order-forms/edit-limit-order-form/edit-limit-order-form.component';
import {
  EditStopOrderFormComponent
} from './components/order-forms/edit-stop-order-form/edit-stop-order-form.component';
import { NzResizeObserverModule } from "ng-zorro-antd/cdk/resize-observer";
import { LetDirective } from "@ngrx/component";
import { InputNumberComponent } from "../../shared/components/input-number/input-number.component";
import { BuySellButtonsComponent } from "./components/buy-sell-buttons/buy-sell-buttons.component";
import { WidgetSettingsComponent } from "../../shared/components/widget-settings/widget-settings.component";
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";

@NgModule({
  declarations: [
    OrdersDialogWidgetComponent,
    CompactHeaderComponent,
    InstrumentInfoComponent,
    OrderEvaluationComponent,
    LimitOrderFormComponent,
    MarketOrderFormComponent,
    StopOrderFormComponent,
    EditOrderDialogWidgetComponent,
    OrderSubmitWidgetComponent,
    OrderSubmitSettingsComponent,
    WorkingVolumesComponent,
    LimitOrderPriceChangeComponent,
    EditLimitOrderFormComponent,
    EditStopOrderFormComponent
  ],
  exports: [
    OrdersDialogWidgetComponent,
    OrderSubmitWidgetComponent,
    EditOrderDialogWidgetComponent
  ],
  imports: [
    CommonModule,
    TranslocoModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzWaveModule,
    NzTypographyModule,
    NzDescriptionsModule,
    NzBadgeModule,
    NzAvatarModule,
    NzTabsModule,
    PushNotificationsModule,
    NzFormModule,
    ReactiveFormsModule,
    SharedModule,
    NzInputNumberLegacyModule,
    NzResizeObserverModule,
    LetDirective,
    InputNumberComponent,
    BuySellButtonsComponent,
    WidgetSettingsComponent,
    InstrumentSearchComponent
  ]
})
export class OrderCommandsModule {
}
