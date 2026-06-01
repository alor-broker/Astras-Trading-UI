import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {PortfolioChartsWidgetSettings} from '@terminal-widgets-lib/widgets/portfolio-charts/widget-settings.types';
import {
  combineLatest,
  distinctUntilChanged,
  map,
  Observable
} from 'rxjs';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {filter} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {AsyncPipe} from '@angular/common';
import {AgreementDynamics} from '@terminal-widgets-lib/widgets/portfolio-charts/components/agreement-dynamics/agreement-dynamics';

@Component({
  selector: 'ats-portfolio-charts-widget',
  imports: [
    TranslocoDirective,
    WidgetSkeleton,
    WidgetHeader,
    AsyncPipe,
    AgreementDynamics
  ],
  templateUrl: './portfolio-charts-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PortfolioChartsWidget extends WidgetBase<PortfolioChartsWidgetSettings> {
  title$!: Observable<string>;

  currentAgreement$: Observable<string> | null = null;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  override ngOnInit(): void {
    super.ngOnInit();

    this.title$ = this.settings$.pipe(
      map(s => `${s.portfolio} (${s.exchange})`)
    );

    this.currentAgreement$ = this.getCurrentAgreement();
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createPortfolioLinkedWidgetSettingsIfMissing<PortfolioChartsWidgetSettings>(
      this.widgetInstance(),
      'PortfolioChartsSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }

  private getCurrentAgreement(): Observable<string> {
    const selectedPortfolio$ = this.settings$.pipe(
      map(s => ({
        portfolio: s.portfolio,
        exchange: s.exchange
      }))
    );

    return combineLatest({
      targetPortfolio: selectedPortfolio$,
      allPortfolios: this.portfoliosStoreFacade.portfolios$
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => p.portfolio === x.targetPortfolio.portfolio && p.exchange === x.targetPortfolio.exchange);
      }),
      filter(p => !!p),
      map(p => p.agreement),
      distinctUntilChanged((previous, current) => previous === current)
    );
  }
}
