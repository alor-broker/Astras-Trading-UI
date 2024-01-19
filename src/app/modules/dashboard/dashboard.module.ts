import { NgModule } from '@angular/core';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { NavbarComponent } from './components/navbar/navbar.component';
import { ParentWidgetComponent } from './components/parent-widget/parent-widget.component';
import { OrderbookModule } from '../orderbook/orderbook.module';
import { DashboardWidgetComponent } from './widgets/dashboard-widget/dashboard-widget.component';
import { LightChartModule } from '../light-chart/light-chart.module';
import { InstrumentsModule } from '../instruments/instruments.module';
import { BlotterModule } from '../blotter/blotter.module';
import { InfoModule } from '../info/info.module';
import { TerminalSettingsModule } from '../terminal-settings/terminal-settings.module';
import { JoyrideModule } from 'ngx-joyride';
import { OnboardingService } from './services/onboarding.service';
import { AllTradesModule } from "../all-trades/all-trades.module";
import { NewsModule } from "../news/news.module";
import { ExchangeRateModule } from "../exchange-rate/exchange-rate.module";
import { TechChartModule } from "../tech-chart/tech-chart.module";
import { AllInstrumentsModule } from "../all-instruments/all-instruments.module";
import { NotificationsModule } from '../notifications/notifications.module';
import { FeedbackModule } from '../feedback/feedback.module';
import { ApplicationMetaModule } from '../application-meta/application-meta.module';
import { NzInputModule } from "ng-zorro-antd/input";
import { ExternalLinkModule } from "../../shared/components/external-link/external-link.module";
import { OrdersBasketModule } from '../orders-basket/orders-basket.module';
import { SelectDashboardMenuComponent } from './components/select-dashboard-menu/select-dashboard-menu.component';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { ScalperOrderBookModule } from '../scalper-order-book/scalper-order-book.module';
import { MobileDashboardWidgetComponent } from './widgets/mobile-dashboard-widget/mobile-dashboard-widget.component';
import { MobileNavbarComponent } from "./components/mobile-navbar/mobile-navbar.component";
import {
  MobileInstrumentsHistoryComponent
} from './components/mobile-instruments-history/mobile-instruments-history.component';
import { MobileDashboardComponent } from "./components/mobile-dashboard/mobile-dashboard.component";
import { NetworkIndicatorComponent } from "./components/network-indicator/network-indicator.component";
import { TreemapModule } from "../treemap/treemap.module";
import { RibbonModule } from '../ribbon/ribbon.module';
import { EventsCalendarModule } from "../events-calendar/events-calendar.module";
import { OptionBoardModule } from "../option-board/option-board.module";
import { ArbitrageSpreadModule } from "../arbitrage-spread/arbitrage-spread.module";
import {PortfolioSummaryModule} from "../portfolio-summary/portfolio-summary.module";
import { NzSegmentedModule } from "ng-zorro-antd/segmented";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { DashboardsPanelComponent } from './components/dashboards-panel/dashboards-panel.component';
import {OrderCommandsModule} from "../order-commands/order-commands.module";
import { EmptyPortfoliosWarningModalWidgetComponent } from './widgets/empty-portfolios-warning-modal-widget/empty-portfolios-warning-modal-widget.component';
import { InstrumentsCorrelationModule } from "../instruments-correlation/instruments-correlation.module";
import { LetDirective } from "@ngrx/component";
import { WidgetsGalleryComponent } from './components/widgets-gallery/widgets-gallery.component';

@NgModule({
  declarations: [
    DashboardWidgetComponent,
    DashboardComponent,
    NavbarComponent,
    ParentWidgetComponent,
    SelectDashboardMenuComponent,
    MobileDashboardWidgetComponent,
    MobileNavbarComponent,
    MobileDashboardComponent,
    MobileInstrumentsHistoryComponent,
    NetworkIndicatorComponent,
    DashboardsPanelComponent,
    EmptyPortfoliosWarningModalWidgetComponent,
    WidgetsGalleryComponent
  ],
    imports: [
        DashboardRoutingModule,
        SharedModule,
        OrderbookModule,
        LightChartModule,
        InstrumentsModule,
        BlotterModule,
        InfoModule,
        TerminalSettingsModule,
        JoyrideModule.forRoot(),
        AllTradesModule,
        NewsModule,
        ExchangeRateModule,
        TechChartModule,
        AllInstrumentsModule,
        NotificationsModule,
        FeedbackModule,
        ApplicationMetaModule,
        NzInputModule,
        ExternalLinkModule,
        OrdersBasketModule,
        ScalperOrderBookModule,
        NzDrawerModule,
        TreemapModule,
        RibbonModule,
        EventsCalendarModule,
        OptionBoardModule,
        ArbitrageSpreadModule,
        PortfolioSummaryModule,
        NzSegmentedModule,
        DragDropModule,
        OrderCommandsModule,
        InstrumentsCorrelationModule,
        LetDirective
        // components
    ],
  providers: [
    OnboardingService
  ]
})
export class DashboardModule {
}
