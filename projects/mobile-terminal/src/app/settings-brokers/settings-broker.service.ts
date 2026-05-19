import {
  DestroyRef,
  inject,
  Injectable
} from '@angular/core';
import {LocalStorageMobileConstants} from "@terminal-core-lib/features/local-storage/local-storage.constants";
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {WidgetSettings} from "@terminal-core-lib/features/widget-settings/widget-settings.types";
import {TerminalSettings} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  of,
  take
} from 'rxjs';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {GlobalLoadingIndicatorService} from '@terminal-core-lib/common/services/global-loading-indicator.service';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {MigrationManagerBase} from '@terminal-core-lib/features/settings-sync/migrations/migration-manager-base';
import {
  DASHBOARD_SETTINGS_MOBILE_MIGRATION_MANAGER,
  TERMINAL_SETTINGS_MOBILE_MIGRATION_MANAGER,
  WIDGETS_SETTINGS_MOBILE_MIGRATION_MANAGER
} from '@terminal-core-lib/features/settings-sync/migrations/settings-migrations.providers';
import {Dashboard} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {MobileDashboardContextService} from '../features/dashboard/services/mobile-dashboard-context.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

@Injectable()
export class SettingsBrokerService {
  private readonly localStorageService = inject(LocalStorageService);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly mobileDashboardContextService = inject(MobileDashboardContextService);

  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly terminalSettingsMigrationManager = inject<MigrationManagerBase>(TERMINAL_SETTINGS_MOBILE_MIGRATION_MANAGER);

  private readonly dashboardSettingsMobileMigrationManager = inject(DASHBOARD_SETTINGS_MOBILE_MIGRATION_MANAGER);

  private readonly widgetSettingsMobileMigrationManager = inject(WIDGETS_SETTINGS_MOBILE_MIGRATION_MANAGER);

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();
  }

  private initWidgetSettingsBroker(): void {
    const saveSettings = (settings: WidgetSettings[]): void => {
      this.localStorageService.setItem(LocalStorageMobileConstants.WidgetsSettingsStorageKey, settings.map(s => [s.guid, s]));
    };

    this.widgetSettingsService.onAnyUpdate().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      saveSettings(e);
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const savedItems = this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageMobileConstants.WidgetsSettingsStorageKey) ?? [];
    const settings = savedItems.map(x => x[1]);

    this.widgetSettingsMobileMigrationManager.applyMigrations<WidgetSettings[]>(
      settings,
      migrated => {
        saveSettings(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      this.widgetSettingsService.init(x.updatedData);
      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private initDashboardSettingsBroker(): void {
    const saveDashboard = (settings: Dashboard): void => this.localStorageService.setItem(LocalStorageMobileConstants.DashboardsSettingsStorageKey, settings);

    this.mobileDashboardContextService.onUpdated().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      saveDashboard((e));
    });

    this.mobileDashboardContextService.onInstrumentHistoryUpdated().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(e => {
      this.localStorageService.setItem(LocalStorageMobileConstants.InstrumentsHistoryStorageKey, e);
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const dashboard = this.localStorageService.getItem<Dashboard>(LocalStorageMobileConstants.DashboardsSettingsStorageKey) ?? null;
    const history = this.localStorageService.getItem<InstrumentKey[]>(LocalStorageMobileConstants.InstrumentsHistoryStorageKey) ?? [];

    if (dashboard == null) {
      this.mobileDashboardContextService.init(
        dashboard,
        history
      );

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
      return;
    }

    this.dashboardSettingsMobileMigrationManager.applyMigrations<Dashboard>(
      dashboard,
      migrated => {
        saveDashboard(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      this.mobileDashboardContextService.init(
        x.updatedData,
        history
      );

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private initTerminalSettingsBroker(): void {
    const saveSettings = (settings: TerminalSettings): void => this.localStorageService.setItem(LocalStorageMobileConstants.TerminalSettingsStorageKey, settings);

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
      this.terminalSettingsService.notifyResetSuccess();
    });

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(LocalStorageMobileConstants.TerminalSettingsStorageKey) ?? null;

    if (terminalSettings == null) {
      this.terminalSettingsService.init(null);
      this.globalLoadingIndicatorService.releaseLoading(loadingId);
      return;
    }

    this.terminalSettingsMigrationManager.applyMigrations<TerminalSettings>(
      terminalSettings,
      migrated => {
        saveSettings(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
        this.terminalSettingsService.init(x.updatedData);
        this.globalLoadingIndicatorService.releaseLoading(loadingId);
      }
    );
  }
}
