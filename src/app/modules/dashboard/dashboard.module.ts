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
import { CommandModule } from '../command/command.module';
import { HelpModule } from '../help/help.module';
import { InfoModule } from '../info/info.module';
import { TerminalSettingsModule } from '../terminal-settings/terminal-settings.module';
import { JoyrideModule } from 'ngx-joyride';
import { OnboardingService } from './services/onboarding.service';
import { AllTradesModule } from "../all-trades/all-trades.module";
import { NewsModule } from "../news/news.module";
import { ExchangeRateModule } from "../exchange-rate/exchange-rate.module";
import { TechChartModule } from "../tech-chart/tech-chart.module";
import { AllInstrumentsModule } from "../all-instruments/all-instruments.module";
import { OrderSubmitModule } from "../order-submit/order-submit.module";
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
    NetworkIndicatorComponent
  ],
    imports: [
        DashboardRoutingModule,
        SharedModule,
        OrderbookModule,
        LightChartModule,
        InstrumentsModule,
        BlotterModule,
        CommandModule,
        HelpModule,
        InfoModule,
        TerminalSettingsModule,
        JoyrideModule.forRoot(),
        AllTradesModule,
        NewsModule,
        ExchangeRateModule,
        TechChartModule,
        AllInstrumentsModule,
        OrderSubmitModule,
        NotificationsModule,
        FeedbackModule,
        ApplicationMetaModule,
        NzInputModule,
        ExternalLinkModule,
        OrdersBasketModule,
        ScalperOrderBookModule,
        NzDrawerModule,
        TreemapModule,
        // components
    ],
  providers: [
    OnboardingService
  ]
})
export class DashboardModule {
}
