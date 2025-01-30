import { NgModule } from '@angular/core';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ParentWidgetComponent } from './components/parent-widget/parent-widget.component';
import { OrderbookModule } from '../orderbook/orderbook.module';
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
import { OrdersBasketModule } from '../orders-basket/orders-basket.module';
import { NzDrawerModule } from "ng-zorro-antd/drawer";
import { ScalperOrderBookModule } from '../scalper-order-book/scalper-order-book.module';
import { TreemapModule } from "../treemap/treemap.module";
import { RibbonModule } from '../ribbon/ribbon.module';
import { EventsCalendarModule } from "../events-calendar/events-calendar.module";
import { OptionBoardModule } from "../option-board/option-board.module";
import { ArbitrageSpreadModule } from "../arbitrage-spread/arbitrage-spread.module";
import { PortfolioSummaryModule } from "../portfolio-summary/portfolio-summary.module";
import { NzSegmentedModule } from "ng-zorro-antd/segmented";
import { DragDropModule } from "@angular/cdk/drag-drop";
import { OrderCommandsModule } from "../order-commands/order-commands.module";
import { InstrumentsCorrelationModule } from "../instruments-correlation/instruments-correlation.module";
import { LetDirective } from "@ngrx/component";
import { NzDividerModule } from "ng-zorro-antd/divider";
import { BondScreenerModule } from "../bond-screener/bond-screener.module";
import { AiChatModule } from "../ai-chat/ai-chat.module";
import { SettingsLoadErrorDialogComponent } from "./components/settings-load-error-dialog/settings-load-error-dialog.component";
import { InstrumentSearchComponent } from "../../shared/components/instrument-search/instrument-search.component";
import { RouterLink } from "@angular/router";
import {DashboardsPanelComponent} from "../../client/components/dashboards-panel/dashboards-panel.component";
import {NetworkIndicatorComponent} from "./components/network-indicator/network-indicator.component";
import { MobileHomeScreenWidgetComponent } from "../mobile-home-screen/widgets/mobile-home-screen-widget/mobile-home-screen-widget.component";

@NgModule({
  declarations: [
    DashboardComponent,
    ParentWidgetComponent,
  ],
    imports: [
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
        LetDirective,
        NzDividerModule,
        BondScreenerModule,
        AiChatModule,
        // components
        SettingsLoadErrorDialogComponent,
        InstrumentSearchComponent,
        RouterLink,
        DashboardsPanelComponent,
        NetworkIndicatorComponent,
        MobileHomeScreenWidgetComponent,
    ],
  exports: [
    DashboardComponent,
    ParentWidgetComponent,
  ],
  providers: [
    OnboardingService
  ]
})
export class DashboardModule {
}
