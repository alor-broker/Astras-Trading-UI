import { Observable } from "rxjs";
import { MigrationMeta } from "./models/migration.model";
import { MigrationManagerBase } from "./migration-manager-base";
import { MigrationsMetaService } from "./services/migrations-meta.service";

export abstract class DesktopMigrationManagerBase extends MigrationManagerBase {
  protected constructor(
    private readonly migrationsMetaService: MigrationsMetaService
  ) {
    super();
  }

  protected getAppliedMigrations(): Observable<MigrationMeta[]> {
    return this.migrationsMetaService.getAppliedMigrations();
  }

  protected saveAppliedMigrations(migrations: string[]): Observable<boolean> {
    return this.migrationsMetaService.saveAppliedMigrations(migrations);
  }
}
