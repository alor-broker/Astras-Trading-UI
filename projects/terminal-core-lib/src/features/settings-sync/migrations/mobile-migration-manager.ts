import {MigrationManagerBase} from './migration-manager-base';
import {
  Observable,
  of
} from "rxjs";
import {inject} from '@angular/core';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {LocalStorageMobileConstants} from '../../local-storage/local-storage.constants';
import {
  MigrationBase,
  MigrationMeta
} from './migration.types';

export class MobileMigrationManager extends MigrationManagerBase {
  private readonly localStorageService = inject(LocalStorageService);

  constructor(protected migrations: MigrationBase[]) {
    super();
  }

  protected getAppliedMigrations(): Observable<MigrationMeta[]> {
    return of(this.getSavedMigrations());
  }

  protected saveAppliedMigrations(migrations: string[]): Observable<boolean> {
    const savedMigrations = this.getSavedMigrations();

    const updatedList = [
      ...savedMigrations,
      ...migrations.map(x => ({
        id: x
      }))
    ];

    this.localStorageService.setItem<MigrationMeta[]>(LocalStorageMobileConstants.MigrationsSettingsStorageKey, updatedList);
    return of(true);
  }

  private getSavedMigrations(): MigrationMeta[] {
    return this.localStorageService.getItem<MigrationMeta[]>(LocalStorageMobileConstants.MigrationsSettingsStorageKey) ?? [];
  }
}
