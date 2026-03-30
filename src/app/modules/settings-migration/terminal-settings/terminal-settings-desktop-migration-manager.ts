import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import { Injectable, inject } from "@angular/core";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected readonly migrationsMetaService: MigrationsMetaService;

  protected migrations = [];

  constructor() {
    const migrationsMetaService = inject(MigrationsMetaService);

    super(migrationsMetaService);

    this.migrationsMetaService = migrationsMetaService;
  }
}
