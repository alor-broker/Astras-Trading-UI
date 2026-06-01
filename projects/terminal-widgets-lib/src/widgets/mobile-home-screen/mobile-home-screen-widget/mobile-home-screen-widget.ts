import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {MobileHomeScreenWidgetSettings} from '@terminal-widgets-lib/widgets/mobile-home-screen/widget-settings.types';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {
  combineLatest,
  filter,
  map,
  Observable
} from 'rxjs';
import {PortfolioKeyEqualityComparer} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {MobileHomeScreenContent} from '@terminal-widgets-lib/widgets/mobile-home-screen/components/mobile-home-screen-content/mobile-home-screen-content';

@Component({
  selector: 'ats-mobile-home-screen-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    MobileHomeScreenContent
  ],
  templateUrl: './mobile-home-screen-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileHomeScreenWidget extends WidgetBase<MobileHomeScreenWidgetSettings> {
  title$!: Observable<string>;

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  override ngOnInit(): void {
    super.ngOnInit();
    this.title$ = combineLatest({
      selectedPortfolio: this.dashboardContextService.selectedPortfolio$,
      allPortfolios: this.userPortfoliosService.portfolios$
    }).pipe(
      map(x => {
        return x.allPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, x.selectedPortfolio));
      }),
      filter(p => !!p),
      map(p => `#${p.agreement}`)
    );
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<MobileHomeScreenWidgetSettings>(
      this.widgetInstance(),
      'MobileHomeScreenSettings',
      settings => ({...settings}),
      this.widgetSettingsService
    );
  }
}
