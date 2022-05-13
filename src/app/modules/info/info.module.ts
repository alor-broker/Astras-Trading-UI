import { NgModule } from '@angular/core';
import { InfoRoutingModule } from './info-routing.module';
import { InfoWidgetComponent } from './widgets/info-widget/info-widget.component';
import { DividendsComponent } from './components/stocks/dividends/dividends.component';
import { CalendarComponent } from './components/bonds/calendar/calendar.component';
import { DescriptionComponent } from './components/common/description/description.component';
import { FinanceComponent } from './components/stocks/finance/finance.component';
import { AboutIssueComponent } from './components/bonds/about-issue/about-issue.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { InfoHeaderComponent } from './components/common/info-header/info-header.component';
import { FinanceBarChartComponent } from './components/common/finance-bar-chart/finance-bar-chart.component';


@NgModule({
  declarations: [
    InfoWidgetComponent,
    DividendsComponent,
    CalendarComponent,
    DescriptionComponent,
    FinanceComponent,
    AboutIssueComponent,
    InfoHeaderComponent,
    FinanceBarChartComponent
  ],
  imports: [
    SharedModule,
    InfoRoutingModule
  ],
  exports: [
    InfoWidgetComponent
  ]
})
export class InfoModule { }
