import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {DEFAULT_RIBBON_ITEMS, RIBBON_REFRESH_INTERVAL, RibbonLayout, RibbonWidgetSettings} from '@terminal-widgets-lib/widgets/ribbon/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {AsyncPipe} from '@angular/common';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {Ribbon} from '@terminal-widgets-lib/widgets/ribbon/components/ribbon/ribbon';
import {RibbonSettings} from '../components/ribbon-settings/ribbon-settings';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {TranslocoDirective} from '@jsverse/transloco';

@Component({
  selector: 'ats-ribbon-widget',
  imports: [
    AsyncPipe,
    NzIconDirective,
    NzButtonComponent,
    Ribbon,
    RibbonSettings,
    WidgetSkeleton,
    TranslocoDirective
  ],
  templateUrl: './ribbon-widget.html',
  styleUrl: './ribbon-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RibbonWidget extends WidgetBase<RibbonWidgetSettings> {
  private readonly manageDashboardService = inject(DesktopManageDashboardsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  readonly defaultRefreshIntervalSec = RIBBON_REFRESH_INTERVAL.defaultValue;
  readonly defaultLayout = RibbonLayout.SingleRow;

  readonly currentDashboard$ = this.dashboardContextService.selectedDashboard$;

  removeWidget($event: MouseEvent | TouchEvent): void {
    $event.preventDefault();
    $event.stopPropagation();
    this.manageDashboardService.removeWidget(this.guid);
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<RibbonWidgetSettings>(
      this.widgetInstance(),
      'RibbonSettings',
      settings => ({
        ...settings,
        layout: settings.layout ?? RibbonLayout.SingleRow,
        refreshIntervalSec: settings.refreshIntervalSec ?? RIBBON_REFRESH_INTERVAL.defaultValue,
        displayItems: (settings.displayItems ?? DEFAULT_RIBBON_ITEMS).map(item => ({...item}))
      }),
      this.widgetSettingsService
    );
  }
}
