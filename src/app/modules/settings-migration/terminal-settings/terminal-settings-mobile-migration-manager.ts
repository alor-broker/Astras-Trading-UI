import { MobileMigrationManagerBase } from "../mobile-migration-manager-base";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { Injectable, inject } from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsMobileMigrationManager extends MobileMigrationManagerBase {
  protected readonly localStorageService: LocalStorageService;

  protected migrations = [];

  constructor() {
    const localStorageService = inject(LocalStorageService);

    super(localStorageService);

    this.localStorageService = localStorageService;
  }
}
