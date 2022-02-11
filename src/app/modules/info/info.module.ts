import { NgModule } from '@angular/core';
import { InfoRoutingModule } from './info-routing.module';
import { InfoWidgetComponent } from './widgets/info-widget/info-widget.component';
import { DividendsComponent } from './components/stocks/dividends/dividends.component';
import { CalendarComponent } from './components/bonds/calendar/calendar.component';
import { DescriptionComponent } from './components/description/description.component';
import { FinanceComponent } from './components/stocks/finance/finance.component';
import { AboutIssueComponent } from './components/bonds/about-issue/about-issue.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FallbackDescriptionComponent } from './components/fallback-description/fallback-description.component';
import { InfoHeaderComponent } from './components/info-header/info-header.component';


@NgModule({
  declarations: [
    InfoWidgetComponent,
    DividendsComponent,
    CalendarComponent,
    DescriptionComponent,
    FinanceComponent,
    AboutIssueComponent,
    FallbackDescriptionComponent,
    InfoHeaderComponent
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
