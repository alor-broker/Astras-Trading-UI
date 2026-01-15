import {NgModule} from '@angular/core';
import {ScalperOrderBookComponent} from './components/scalper-order-book/scalper-order-book.component';
import {ScalperOrderBookTableComponent} from './components/scalper-order-book-table/scalper-order-book-table.component';
import {TradesPanelComponent} from './components/trades-panel/trades-panel.component';
import {ScalperOrderBookBodyComponent} from './components/scalper-order-book-body/scalper-order-book-body.component';
import {NzResizeObserverModule} from 'ng-zorro-antd/cdk/resize-observer';
import {CurrentPositionPanelComponent} from './components/current-position-panel/current-position-panel.component';
import {WorkingVolumesPanelComponent} from './components/working-volumes-panel/working-volumes-panel.component';
import {ModifiersIndicatorComponent} from './components/modifiers-indicator/modifiers-indicator.component';
import {
  ScalperOrderBookSettingsComponent
} from './components/scalper-order-book-settings/scalper-order-book-settings.component';
import {NzInputModule} from 'ng-zorro-antd/input';
import {ScalperOrderBookWidgetComponent} from './widgets/scalper-order-book-widget/scalper-order-book-widget.component';
import {NzSpinModule} from 'ng-zorro-antd/spin';
import {OrdersIndicatorComponent} from './components/orders-indicator/orders-indicator.component';
import {CdkDrag, CdkDropList, CdkDropListGroup} from '@angular/cdk/drag-drop';
import {PossibleActionsPanelComponent} from './components/possible-actions-panel/possible-actions-panel.component';
import {TradeClustersPanelComponent} from './components/trade-clusters-panel/trade-clusters-panel.component';
import {TradesClusterComponent} from './components/trades-cluster/trades-cluster.component';
import {HoverItemDirective} from './directives/hover-item.directive';
import {HoverItemsGroupDirective} from './directives/hover-items-group.directive';
import {TableRulerComponent} from './components/table-ruler/table-ruler.component';
import {LetDirective} from "@ngrx/component";
import {PanelsContainerComponent} from "./components/panels/panels-container/panels-container.component";
import {PanelComponent} from "./components/panels/panel/panel.component";
import {PanelResizeHandlerComponent} from "./components/panels/panel-resize-handler/panel-resize-handler.component";
import {BottomFloatingPanelComponent} from './components/bottom-floating-panel/bottom-floating-panel.component';
import {TopFloatingPanelComponent} from './components/top-floating-panel/top-floating-panel.component';
import {ShortLongIndicatorComponent} from './components/short-long-indicator/short-long-indicator.component';
import {NzSliderModule} from "ng-zorro-antd/slider";
import {
  LimitOrdersVolumeIndicatorComponent
} from './components/limit-orders-volume-indicator/limit-orders-volume-indicator.component';
import {TopPanelComponent} from './components/top-panel/top-panel.component';
import {InputNumberComponent} from "../../shared/components/input-number/input-number.component";
import {WidgetSettingsComponent} from "../../shared/components/widget-settings/widget-settings.component";
import {InstrumentSearchComponent} from "../../shared/components/instrument-search/instrument-search.component";
import {CancelOrdersCommand} from "./commands/cancel-orders-command";
import {ScalperCommandProcessorService} from "./services/scalper-command-processor.service";
import {ClosePositionByMarketCommand} from "./commands/close-position-by-market-command";
import {GetBestOfferCommand} from "./commands/get-best-offer-command";
import {ReversePositionByMarketCommand} from "./commands/reverse-position-by-market-command";
import {SetStopLossCommand} from "./commands/set-stop-loss-command";
import {SubmitBestPriceOrderCommand} from "./commands/submit-best-price-order-command";
import {SubmitLimitOrderCommand} from "./commands/submit-limit-order-command";
import {SubmitMarketOrderCommand} from "./commands/submit-market-order-command";
import {SubmitStopLimitOrderCommand} from "./commands/submit-stop-limit-order-command";
import {UpdateOrdersCommand} from "./commands/update-orders-command";

@NgModule({
  imports: [
    NzResizeObserverModule,
    NzInputModule,
    NzSpinModule,
    CdkDropListGroup,
    CdkDropList,
    CdkDrag,
    LetDirective,
    NzSliderModule,
    InputNumberComponent,
    WidgetSettingsComponent,
    InstrumentSearchComponent,
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
    TableRulerComponent,
    PanelsContainerComponent,
    PanelComponent,
    PanelResizeHandlerComponent,
    BottomFloatingPanelComponent,
    TopFloatingPanelComponent,
    ShortLongIndicatorComponent,
    LimitOrdersVolumeIndicatorComponent,
    TopPanelComponent
  ],
  exports: [
    ScalperOrderBookWidgetComponent
  ],
  providers: [
    CancelOrdersCommand,
    ClosePositionByMarketCommand,
    GetBestOfferCommand,
    ReversePositionByMarketCommand,
    SetStopLossCommand,
    SubmitBestPriceOrderCommand,
    SubmitLimitOrderCommand,
    SubmitMarketOrderCommand,
    SubmitStopLimitOrderCommand,
    UpdateOrdersCommand,
    ScalperCommandProcessorService,
  ]
})
export class ScalperOrderBookModule {
}
