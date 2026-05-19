import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
  switchMap
} from "rxjs";
import {F} from "@angular/cdk/keycodes";
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {PortfolioSummaryService} from '@terminal-core-lib/features/portfolios/services/portfolio-summary.service';
import {MarketType} from '@terminal-core-lib/common/types/portfolio.types';
import {
  CommonSummaryView,
  ForwardRisksView
} from '@terminal-core-lib/features/portfolios/services/portfolio-summary-service.types';
import {PortfolioSummaryWidgetSettings} from '@terminal-widgets-lib/widgets/portfolio-summary/widget-settings.types';
import {WidgetSettingsHelper} from '@terminal-core-lib/features/widget-settings/utils/widget-settings.helper';
import {ScrollableRow} from '@terminal-core-lib/features/scrollable-row/components/scrollable-row/scrollable-row';
import {ScrollableItem} from '@terminal-core-lib/features/scrollable-row/directives/scrollable-item';

@Component({
  selector: 'ats-portfolio-summary',
  templateUrl: './portfolio-summary.html',
  styleUrls: ['./portfolio-summary.less'],
  imports: [
    TranslocoDirective,
    AsyncPipe,
    ScrollableRow,
    ScrollableItem
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class PortfolioSummary implements OnInit {
  readonly marketTypes = MarketType;

  readonly guid = input.required<string>();

  settings$!: Observable<PortfolioSummaryWidgetSettings>;

  commonSummary$!: Observable<CommonSummaryView>;

  forwardSummary$!: Observable<ForwardRisksView>;

  protected readonly F = F;

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly portfolioSummaryService = inject(PortfolioSummaryService);

  ngOnInit(): void {
    this.settings$ = this.widgetSettingsService.getSettings<PortfolioSummaryWidgetSettings>(this.guid()).pipe(
      distinctUntilChanged((previous, current) => WidgetSettingsHelper.isEqualPortfolioDependedSettings(previous, current)),
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
