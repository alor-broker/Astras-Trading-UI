import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScalperOrderBookComponent } from './components/scalper-order-book/scalper-order-book.component';
import { SharedModule } from '../../shared/shared.module';
import { ScalperOrderBookTableComponent } from './components/scalper-order-book-table/scalper-order-book-table.component';
import { TradesPanelComponent } from './components/trades-panel/trades-panel.component';
import { ScalperOrderBookBodyComponent } from './components/scalper-order-book-body/scalper-order-book-body.component';
import { NzResizeObserverModule } from 'ng-zorro-antd/cdk/resize-observer';
import { CurrentPositionPanelComponent } from './components/current-position-panel/current-position-panel.component';
import { WorkingVolumesPanelComponent } from './components/working-volumes-panel/working-volumes-panel.component';
import { ModifiersIndicatorComponent } from './components/modifiers-indicator/modifiers-indicator.component';
import { ScalperOrderBookSettingsComponent } from './components/scalper-order-book-settings/scalper-order-book-settings.component';
import { NzInputModule } from 'ng-zorro-antd/input';
import { ScalperOrderBookWidgetComponent } from './widgets/scalper-order-book-widget/scalper-order-book-widget.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { OrdersIndicatorComponent } from './components/orders-indicator/orders-indicator.component';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup
} from '@angular/cdk/drag-drop';
import { PossibleActionsPanelComponent } from './components/possible-actions-panel/possible-actions-panel.component';
import { TradeClustersPanelComponent } from './components/trade-clusters-panel/trade-clusters-panel.component';
import { TradesClusterComponent } from './components/trades-cluster/trades-cluster.component';
import { HoverItemDirective } from './directives/hover-item.directive';
import { HoverItemsGroupDirective } from './directives/hover-items-group.directive';
import { TableRulerComponent } from './components/table-ruler/table-ruler.component';
import { LetDirective } from "@ngrx/component";

@NgModule({
  declarations: [
    ScalperOrderBookWidgetComponent,
    ScalperOrderBookComponent,
    ScalperOrderBookTableComponent,
    TradesPanelComponent,
    ScalperOrderBookBodyComponent,
    CurrentPositionPanelComponent,
    WorkingVolumesPanelComponent,
    ModifiersIndicatorComponent,
    ScalperOrderBookSettingsComponent,
    OrdersIndicatorComponent,
    TradeClustersPanelComponent,
    TradesClusterComponent,
    PossibleActionsPanelComponent,
    HoverItemDirective,
    HoverItemsGroupDirective,
    TableRulerComponent
  ],
    imports: [
        CommonModule,
        SharedModule,
        NzResizeObserverModule,
        NzInputModule,
        NzSpinModule,
        CdkDropListGroup,
        CdkDropList,
        CdkDrag,
        LetDirective
    ],
  exports: [
    ScalperOrderBookWidgetComponent
  ]
})
export class ScalperOrderBookModule {
}
