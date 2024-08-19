import {
  Injectable
} from "@angular/core";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected migrations = [
    // UpdateBadgesWidgetsSettingsMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesWidgetsSettingsMigration)
  ];

  constructor(protected readonly localStorageService: LocalStorageService) {
    super(localStorageService);
  }
}
