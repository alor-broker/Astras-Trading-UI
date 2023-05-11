import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ArbitrationExtensionWidgetComponent
} from './widgets/arbitration-extension-widget/arbitration-extension-widget.component';
import { SharedModule } from "../../shared/shared.module";
import {
  ArbitrationExtensionModalWidgetComponent
} from './widgets/arbitration-extension-modal-widget/arbitration-extension-modal-widget.component';
import {
  ArbitrationExtensionTableComponent
} from "./components/arbitration-extension-table/arbitration-extension-table.component";
import {
  ArbitrationExtensionManageComponent
} from './components/arbitration-extension-manage/arbitration-extension-manage.component';


@NgModule({
  declarations: [
    ArbitrationExtensionWidgetComponent,
    ArbitrationExtensionTableComponent,
    ArbitrationExtensionModalWidgetComponent,
    ArbitrationExtensionManageComponent
  ],
  exports: [
    ArbitrationExtensionWidgetComponent,
    ArbitrationExtensionModalWidgetComponent
  ],
  imports: [
    CommonModule,
    SharedModule
  ]
})
export class ArbitrationExtensionModule {
}
