import {AddTradeScreenWidgetMigration} from './dashboard-settings/add-trade-screen-widget.migration';
import {
  inject,
  InjectionToken,
  Provider
} from '@angular/core';
import {MigrationManagerBase} from './migration-manager-base';
import {AppliedMigrationsRemoteStorageService} from './services/applied-migrations-remote-storage.service';
import {DesktopMigrationManager} from './desktop-migration-manager';
import {MobileMigrationManager} from './mobile-migration-manager';

export const DASHBOARD_SETTINGS_DESKTOP_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('DASHBOARD_SETTINGS_DESKTOP_MIGRATION_MANAGER');
export const DASHBOARD_SETTINGS_MOBILE_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('DASHBOARD_SETTINGS_MOBILE_MIGRATION_MANAGER');

export const TERMINAL_SETTINGS_DESKTOP_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('TERMINAL_SETTINGS_DESKTOP_MIGRATION_MANAGER');
export const TERMINAL_SETTINGS_MOBILE_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('TERMINAL_SETTINGS_MOBILE_MIGRATION_MANAGER');

export const WIDGETS_SETTINGS_DESKTOP_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('WIDGETS_SETTINGS_DESKTOP_MIGRATION_MANAGER');
export const WIDGETS_SETTINGS_MOBILE_MIGRATION_MANAGER = new InjectionToken<MigrationManagerBase>('WIDGETS_SETTINGS_MOBILE_MIGRATION_MANAGER');

export function provideDesktopSettingsMigrations(): Provider[] {
  return [
    AppliedMigrationsRemoteStorageService,
    {
      provide: DASHBOARD_SETTINGS_DESKTOP_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new DesktopMigrationManager([
          // inject(UpdateBadgesDesktopDashboardMigration)
        ]);
      }
    },
    {
      provide: TERMINAL_SETTINGS_DESKTOP_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new DesktopMigrationManager([]);
      }
    },
    {
      provide: WIDGETS_SETTINGS_DESKTOP_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new DesktopMigrationManager([
          // inject(UpdateBadgesWidgetsSettingsMigration)
        ]);
      }
    }
  ];
}

export function provideMobileSettingsMigrations(): Provider[] {
  return [
    AddTradeScreenWidgetMigration,
    {
      provide: DASHBOARD_SETTINGS_MOBILE_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new MobileMigrationManager([
          inject(AddTradeScreenWidgetMigration)
        ]);
      }
    },
    {
      provide: TERMINAL_SETTINGS_MOBILE_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new MobileMigrationManager([]);
      }
    },
    {
      provide: WIDGETS_SETTINGS_MOBILE_MIGRATION_MANAGER,
      useFactory: (): MigrationManagerBase => {
        return new MobileMigrationManager([
          // inject(UpdateBadgesWidgetsSettingsMigration)
        ]);
      }
    }
  ];
}
