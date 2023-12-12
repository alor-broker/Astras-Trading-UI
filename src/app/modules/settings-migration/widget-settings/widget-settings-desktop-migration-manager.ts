import { DesktopMigrationManagerBase } from "../desktop-migration-manager-base";
import {
  inject,
  Injectable
} from "@angular/core";
import { UpdateBadgesWidgetsSettingsMigration } from "./migrations/update-badges-widgets-settings.migration";
import { MigrationsMetaService } from "../services/migrations-meta.service";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsDesktopMigrationManager extends DesktopMigrationManagerBase {
  protected migrations = [
    inject(UpdateBadgesWidgetsSettingsMigration)
  ];
  constructor(protected readonly migrationsMetaService: MigrationsMetaService) {
    super(migrationsMetaService);
  }
}
