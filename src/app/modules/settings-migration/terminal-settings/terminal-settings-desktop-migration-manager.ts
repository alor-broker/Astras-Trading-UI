import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { Injectable } from "@angular/core";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected migrations = [];

  constructor(protected readonly migrationsMetaService: MigrationsMetaService) {
    super(migrationsMetaService);
  }
}
