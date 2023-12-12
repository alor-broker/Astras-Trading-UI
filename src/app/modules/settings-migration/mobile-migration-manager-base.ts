import { MigrationManagerBase } from "./migration-manager-base";
import {
  Observable,
  of
} from "rxjs";
import { MigrationMeta } from "./models/migration.model";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { LocalStorageMobileConstants } from "../../shared/constants/local-storage.constants";

export abstract class MobileMigrationManagerBase extends MigrationManagerBase {
  protected constructor(private readonly localStorageService: LocalStorageService) {
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
