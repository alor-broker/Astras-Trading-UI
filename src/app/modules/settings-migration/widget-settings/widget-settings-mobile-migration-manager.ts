import { Injectable, inject } from "@angular/core";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";

@Injectable({
  providedIn: 'root'
})
export class WidgetSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected readonly localStorageService: LocalStorageService;

  protected migrations = [
    // UpdateBadgesWidgetsSettingsMigration is obsolete. Keep here just as example
    // inject(UpdateBadgesWidgetsSettingsMigration)
  ];

  constructor() {
    const localStorageService = inject(LocalStorageService);

    super(localStorageService);

    this.localStorageService = localStorageService;
  }
}
