import {
  inject,
  Injectable
} from "@angular/core";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";
import { UpdateBadgesWidgetsSettingsMigration } from "./migrations/update-badges-widgets-settings.migration";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected migrations = [
    inject(UpdateBadgesWidgetsSettingsMigration)
  ];

  constructor(protected readonly localStorageService: LocalStorageService) {
    super(localStorageService);
  }
}
