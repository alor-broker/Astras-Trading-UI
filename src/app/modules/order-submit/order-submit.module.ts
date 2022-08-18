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


@NgModule({
  declarations: [
    OrderSubmitWidgetComponent,
    OrderSubmitSettingsComponent,
    OrderSubmitComponent
  ],
  imports: [
    CommonModule,
    NzFormModule,
    NzSelectModule,
    NzCollapseModule,
    NzWaveModule,
    ReactiveFormsModule,
    NzInputModule,
    NzButtonModule
  ],
  exports: [OrderSubmitWidgetComponent]
})
export class OrderSubmitModule {
}
