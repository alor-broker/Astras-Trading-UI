import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {RibbonWidgetSettings} from '@terminal-widgets-lib/widgets/ribbon/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {AsyncPipe} from '@angular/common';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {Ribbon} from '@terminal-widgets-lib/widgets/ribbon/components/ribbon/ribbon';

@Component({
  selector: 'ats-ribbon-widget',
  imports: [
    AsyncPipe,
    NzIconDirective,
    NzButtonComponent,
    Ribbon
  ],
  templateUrl: './ribbon-widget.html',
  styleUrl: './ribbon-widget.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RibbonWidget extends WidgetBase<RibbonWidgetSettings> {
  private readonly manageDashboardService = inject(DesktopManageDashboardsService);

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

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
        ...settings
      }),
      this.widgetSettingsService
    );
  }
}
