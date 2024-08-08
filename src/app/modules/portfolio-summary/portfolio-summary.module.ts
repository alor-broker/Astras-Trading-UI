import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PortfolioSummaryWidgetComponent} from './widgets/portfolio-summary-widget/portfolio-summary-widget.component';
import {NzIconModule} from "ng-zorro-antd/icon";
import {NzButtonModule} from "ng-zorro-antd/button";
import {PortfolioSummaryComponent} from './components/portfolio-summary/portfolio-summary.component';
import {TranslocoModule} from "@jsverse/transloco";
import {NzTypographyModule} from "ng-zorro-antd/typography";
import {SharedModule} from "../../shared/shared.module";

@NgModule({
  declarations: [
    PortfolioSummaryWidgetComponent,
    PortfolioSummaryComponent
  ],
  exports: [
    PortfolioSummaryWidgetComponent
  ],
  imports: [
    CommonModule,
    NzIconModule,
    NzButtonModule,
    TranslocoModule,
    NzTypographyModule,
    SharedModule
  ]
})
export class PortfolioSummaryModule {
}
