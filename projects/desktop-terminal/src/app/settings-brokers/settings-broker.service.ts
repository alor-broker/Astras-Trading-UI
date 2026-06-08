import {DashboardsSettingsBrokerService} from './dashboards-settings-broker.service';
import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {WidgetSettingsBrokerService} from './widget-settings-broker.service';
import {TerminalSettingsBrokerService} from './terminal-settings-broker.service';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {
  combineLatest,
  take
} from 'rxjs';
import {ClientDashboardType} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {GuidGenerator} from "@terminal-core-lib/common/utils/guid-generator";
import {ArrayHelper} from '@terminal-core-lib/common/utils/array.helper';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {DashboardTemplatesService} from '@terminal-core-lib/features/dashboard/services/dashboard-templates.service';
import {DefaultDesktopDashboardConfig} from '@terminal-core-lib/features/dashboard/services/dashboard-templates-service.types';

export interface InitSettingsBrokersOptions {
  onSettingsReadError: () => void;
}

@Injectable()
export class SettingsBrokerService {
  private readonly dashboardsSettingsBrokerService = inject(DashboardsSettingsBrokerService);

  private readonly widgetSettingsBrokerService = inject(WidgetSettingsBrokerService);

  private readonly terminalSettingsBrokerService = inject(TerminalSettingsBrokerService);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly dashboardTemplatesService = inject(DashboardTemplatesService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly destroyRef = inject(DestroyRef);

  initSettingsBrokers(options: InitSettingsBrokersOptions): void {
    this.initTerminalSettingsBroker(options);
    this.initWidgetSettingsBroker(options);
    this.initDashboardSettingsBroker(options);

    this.checkDirtyWidgetSettings();
  }

  private initDashboardSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.manageDashboardsService.onUpdated().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.dashboardsSettingsBrokerService.saveSettings(e.dashboards).pipe(
        take(1)
      ).subscribe();
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.dashboardsSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(dashboards => {
      if (dashboards == null) {
        options.onSettingsReadError();
      } else {
        if (dashboards.settings.length > 0) {
          this.manageDashboardsService.init(dashboards.settings);

          this.globalLoadingIndicatorService.releaseLoading(loadingId);
        } else {
          this.dashboardTemplatesService.getDashboardTemplatesConfig().pipe(
            take(1)
          ).subscribe(config => {
            this.manageDashboardsService.init([]);

            const defaultDashboardsConfig = config
              .filter(d => d.type === ClientDashboardType.ClientDesktop)
              .map(d => d as DefaultDesktopDashboardConfig);

            defaultDashboardsConfig.forEach((d, index) => {
              this.manageDashboardsService.addDashboardWithTemplate({
                templateId: d.id,
                title: d.name ?? 'Dashboard',
                isSelected: index === 0,
                items: d.widgets.map(w => ({
                  guid: GuidGenerator.newGuid(),
                  widgetType: w.widgetTypeId,
                  position: w.position,
                  initialSettings: w.initialSettings
                })),
                isFavorite: d.isFavorite,
                type: d.type
              });
            });

            this.globalLoadingIndicatorService.releaseLoading(loadingId);
          });
        }
      }
    });
  }

  private initWidgetSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.widgetSettingsService.onRemoved().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.widgetSettingsBrokerService.removeSettings(e.settingGuids).pipe(
        take(1)
      ).subscribe();
    });

    this.widgetSettingsService.onAdd().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.saveWidgetSettings(e.settings.map(s => s.guid));
    });

    this.widgetSettingsService.onUpdateContent().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.saveWidgetSettings([e.guid]);
    });

    this.widgetSettingsService.onUpdateInstrument().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.saveWidgetSettings(e.guids);
    });

    this.widgetSettingsService.onUpdatePortfolio().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.saveWidgetSettings(e.guids);
    });

    this.widgetSettingsService.onSetDefaultBadge().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.saveWidgetSettings(e.guids);
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.widgetSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      if (settings == null) {
        options.onSettingsReadError();
      } else {
        this.widgetSettingsService.init(settings);
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private initTerminalSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.terminalSettingsService.onUpdate().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.terminalSettingsService.getSettings(true).pipe(
        take(1),
      ).subscribe(settings => {
        this.terminalSettingsBrokerService.saveSettings(settings).pipe(
          take(1)
        ).subscribe(() => {
          this.terminalSettingsService.notifySaveSuccess();
        });
      });
    });

    this.terminalSettingsService.onReset().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.terminalSettingsBrokerService.removeSettings().pipe(
        take(1)
      ).subscribe(() => {
        this.terminalSettingsService.notifyResetSuccess();
      });
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.terminalSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      if (settings == null) {
        options.onSettingsReadError();
      } else {
        this.terminalSettingsService.init(settings.settings);
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private checkDirtyWidgetSettings(): void {
    combineLatest([
      this.manageDashboardsService.allDashboards$,
      this.widgetSettingsService.getAllSettings()
    ]).pipe(
      take(1)
    ).subscribe(([allDashboards, allSettings]) => {
      if (allDashboards.length === 0 || allSettings.length === 0) {
        return;
      }

      const allWidgets = new Set(ArrayHelper.mergeArrays(allDashboards.map(d => d.items)).map(w => w.guid));

      const dirtySettings = allSettings
        .filter(s => !allWidgets.has(s.guid))
        .map(s => s.guid);

      if (dirtySettings.length === 0) {
        return;
      }

      this.widgetSettingsBrokerService.removeSettings(dirtySettings).pipe(
        take(1)
      ).subscribe();
      this.widgetLocalStateService.clearForWidgets(dirtySettings);
    });
  }

  private saveWidgetSettings(widgetGuids: string[]): void {
    this.widgetSettingsService.getAllSettings().pipe(
      take(1)
    ).subscribe(allSettings => {
      const guids = new Set(widgetGuids);
      const updatedSettings = allSettings.filter(s => guids.has(s.guid));

      this.widgetSettingsBrokerService.saveSettings(updatedSettings).pipe(
        take(1)
      ).subscribe();
    });
  }
}
