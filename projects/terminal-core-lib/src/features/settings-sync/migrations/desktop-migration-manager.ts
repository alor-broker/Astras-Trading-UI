import {MigrationManagerBase} from './migration-manager-base';
import {Observable} from 'rxjs';

import {inject} from '@angular/core';
import {AppliedMigrationsRemoteStorageService} from './services/applied-migrations-remote-storage.service';
import {
  MigrationBase,
  MigrationMeta
} from './migration.types';

export class DesktopMigrationManager extends MigrationManagerBase {
  private readonly appliedMigrationsService = inject(AppliedMigrationsRemoteStorageService);

  constructor(protected migrations: MigrationBase[]) {
    super();
  }

  protected getAppliedMigrations(): Observable<MigrationMeta[]> {
    return this.appliedMigrationsService.getAppliedMigrations();
  }

  protected saveAppliedMigrations(migrations: string[]): Observable<boolean> {
    return this.appliedMigrationsService.saveAppliedMigrations(migrations);
  }
}
