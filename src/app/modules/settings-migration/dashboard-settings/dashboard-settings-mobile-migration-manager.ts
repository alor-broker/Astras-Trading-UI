import {MobileMigrationManagerBase} from "../mobile-migration-manager-base";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {inject, Injectable} from "@angular/core";
import { AddTradeScreenWidgetMigration } from "./migrations/add-trade-screen-widget.migration";

@Injectable({
  providedIn: 'root'
})
export class DashboardSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected readonly localStorageService: LocalStorageService;

  protected migrations = [
    inject(AddTradeScreenWidgetMigration)
  ];

  constructor() {
    const localStorageService = inject(LocalStorageService);

    super(localStorageService);

    this.localStorageService = localStorageService;
  }
}
