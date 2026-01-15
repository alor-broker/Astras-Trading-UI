import { Component, OnInit, input, inject } from '@angular/core';
import {distinctUntilChanged, Observable, shareReplay, switchMap} from "rxjs";
import {PortfolioSummarySettings} from "../../models/portfolio-summary-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {MarketType} from "../../../../shared/models/portfolio-key.model";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {F} from "@angular/cdk/keycodes";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {CommonSummaryView} from "../../../../shared/models/common-summary-view.model";
import {ForwardRisksView} from "../../../../shared/models/forward-risks-view.model";
import {TranslocoDirective} from '@jsverse/transloco';
import {ScrollableRowComponent} from '../../../../shared/components/scrollable-row/scrollable-row.component';
import {ScrollableItemDirective} from '../../../../shared/directives/scrollable-item.directive';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  styleUrls: ['./portfolio-summary.component.less'],
  imports: [
    TranslocoDirective,
    ScrollableRowComponent,
    ScrollableItemDirective,
    AsyncPipe
  ]
})
export class PortfolioSummaryComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly portfolioSummaryService = inject(PortfolioSummaryService);

  readonly marketTypes = MarketType;
  readonly guid = input.required<string>();

  settings$!: Observable<PortfolioSummarySettings>;
  commonSummary$!: Observable<CommonSummaryView>;
  forwardSummary$!: Observable<ForwardRisksView>;
  protected readonly F = F;

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<PortfolioSummarySettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => isEqualPortfolioDependedSettings(previous, current)),
      shareReplay(1)
    );

    this.commonSummary$ = this.settings$.pipe(
      switchMap(settings => this.portfolioSummaryService.getCommonSummary(settings))
    );

    this.forwardSummary$ = this.settings$.pipe(
      switchMap(settings => this.portfolioSummaryService.getForwardRisks(settings))
    );
  }
}
