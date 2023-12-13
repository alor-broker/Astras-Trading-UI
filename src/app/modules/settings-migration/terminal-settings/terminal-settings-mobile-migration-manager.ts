import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { Injectable } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected migrations = [];

  constructor(protected readonly localStorageService: LocalStorageService) {
    super(localStorageService);
  }
}
