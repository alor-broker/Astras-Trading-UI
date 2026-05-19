import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {GlobalLoadingIndicatorService} from "@terminal-core-lib/common/services/global-loading-indicator.service";
import {GuidGenerator} from "@terminal-core-lib/common/utils/guid-generator";
import {DesktopManageDashboardsService} from "@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service";
import {DashboardTemplatesService} from "@terminal-core-lib/features/dashboard/services/dashboard-templates.service";
import {LocalStorageAdminConstants} from "@terminal-core-lib/features/local-storage/local-storage.constants";
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {TerminalSettingsService} from "@terminal-core-lib/features/terminal-settings/services/terminal-settings.service";
import {WidgetSettingsService} from "@terminal-core-lib/features/widget-settings/services/widget-settings.service";
import {WidgetSettings} from "@terminal-core-lib/features/widget-settings/widget-settings.types";
import {
  AdminDashboardType,
  Dashboard
} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {take} from 'rxjs';
import {DefaultDesktopDashboardConfig} from '@terminal-core-lib/features/dashboard/services/dashboard-templates-service.types';
import {
  OrdersInstantNotificationType,
  TerminalSettings
} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';

@Injectable({providedIn: 'root'})
export class SettingsBrokerService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

  private readonly dashboardTemplatesService = inject(DashboardTemplatesService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly destroyRef = inject(DestroyRef);

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();
  }

  private initWidgetSettingsBroker(): void {
    const saveSettings = (settings: WidgetSettings[]): void => {
      this.localStorageService.setItem(LocalStorageAdminConstants.WidgetsSettingsStorageKey, settings.map(s => [s.guid, s]));
    };

    this.widgetSettingsService.onAnyUpdate().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      saveSettings(e);
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const savedItems = this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageAdminConstants.WidgetsSettingsStorageKey) ?? [];
    const settings = savedItems.map(x => x[1]);

    this.widgetSettingsService.init(settings);

    this.globalLoadingIndicatorService.releaseLoading(loadingId);
  }

  private initDashboardSettingsBroker(): void {
    const saveDashboard = (settings: Dashboard[]): void => this.localStorageService.setItem(LocalStorageAdminConstants.DashboardsSettingsStorageKey, settings);

    this.manageDashboardsService.onUpdated().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      saveDashboard(e.dashboards);
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const dashboards = this.localStorageService.getItem<Dashboard[]>(LocalStorageAdminConstants.DashboardsSettingsStorageKey) ?? null;

    this.manageDashboardsService.init(dashboards ?? []);

    if ((dashboards ?? []).length === 0) {
      this.dashboardTemplatesService.getDashboardTemplatesConfig().pipe(
        take(1)
      ).subscribe(config => {
        const defaultDashboardsConfig = config
          .filter(d => d.type === AdminDashboardType.AdminMain)
          .map(d => d as DefaultDesktopDashboardConfig);

        defaultDashboardsConfig.forEach((d) => {
          this.manageDashboardsService.addDashboardWithTemplate({
            title: "All Clients",
            isSelected: true,
            templateId: d.id,
            items: d.widgets.map(w => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            })),
            isFavorite: true,
            type: d.type
          });
        });

        this.globalLoadingIndicatorService.releaseLoading(loadingId);
      });
    } else {
      const adminDashboard = dashboards!.find(d => d.type === AdminDashboardType.AdminMain);

      if (adminDashboard != null) {
        this.manageDashboardsService.selectDashboard(adminDashboard.guid);
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    }
  }

  private initTerminalSettingsBroker(): void {
    const saveSettings = (settings: TerminalSettings): void => this.localStorageService.setItem(LocalStorageAdminConstants.TerminalSettingsStorageKey, settings);

    this.terminalSettingsService.onUpdate().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.terminalSettingsService.getSettings(true).pipe(
        take(1),
      ).subscribe(settings => {
        saveSettings(settings);
        this.terminalSettingsService.notifySaveSuccess();
      });
    });

    this.terminalSettingsService.onReset().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.localStorageService.removeItem(LocalStorageAdminConstants.TerminalSettingsStorageKey);
      this.localStorageService.removeItem(LocalStorageAdminConstants.WidgetsSettingsStorageKey);
      this.localStorageService.removeItem(LocalStorageAdminConstants.DashboardsSettingsStorageKey);
      this.terminalSettingsService.notifyResetSuccess();
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(LocalStorageAdminConstants.TerminalSettingsStorageKey) ?? null;

    if (!terminalSettings) {
      this.terminalSettingsService.init(null);
      this.setDefaultSettings();
      this.globalLoadingIndicatorService.releaseLoading(loadingId);
      return;
    }

    this.terminalSettingsService.init(terminalSettings);
    this.setDefaultSettings();
    this.globalLoadingIndicatorService.releaseLoading(loadingId);
  }

  private setDefaultSettings(): void {
    this.terminalSettingsService.updateSettings(
      {
        instantNotificationsSettings: {
          hiddenNotifications: [
            OrdersInstantNotificationType.OrderFilled,
            OrdersInstantNotificationType.OrderPartiallyFilled,
            OrdersInstantNotificationType.OrderStatusChanged,
            OrdersInstantNotificationType.OrderStatusChangeToCancelled
          ]
        }
      },
      false
    );
  }
}
