import {Component, Input, OnInit} from '@angular/core';
import {distinctUntilChanged, Observable, shareReplay, switchMap} from "rxjs";
import {PortfolioSummarySettings} from "../../models/portfolio-summary-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {MarketType} from "../../../../shared/models/portfolio-key.model";
import {isEqualPortfolioDependedSettings} from "../../../../shared/utils/settings-helper";
import {F} from "@angular/cdk/keycodes";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {CommonSummaryView} from "../../../../shared/models/common-summary-view.model";
import {ForwardRisksView} from "../../../../shared/models/forward-risks-view.model";

@Component({
  selector: 'ats-portfolio-summary',
  templateUrl: './portfolio-summary.component.html',
  styleUrls: ['./portfolio-summary.component.less']
})
export class PortfolioSummaryComponent implements OnInit {
  readonly marketTypes = MarketType;
  @Input({required: true})
  guid!: string;

  settings$!: Observable<PortfolioSummarySettings>;
  commonSummary$!: Observable<CommonSummaryView>;
  forwardSummary$!: Observable<ForwardRisksView>;
  protected readonly F = F;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly portfolioSummaryService: PortfolioSummaryService,
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<PortfolioSummarySettings>(this.guid).pipe(
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
