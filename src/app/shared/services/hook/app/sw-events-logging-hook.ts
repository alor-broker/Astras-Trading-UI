import { Injectable, inject } from "@angular/core";
import { AppHook } from "./app-hook-token";
import { Subscription } from "rxjs";
import { SwUpdate } from "@angular/service-worker";
import { LoggerService } from "../../logging/logger.service";

@Injectable()
export class SwEventsLoggingHook implements AppHook {
  private readonly swUpdates = inject(SwUpdate);
  private readonly loggerService = inject(LoggerService);

  private subscription: Subscription | null = null;

  onDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onInit(): void {
    this.subscription = this.swUpdates.versionUpdates.subscribe(evt => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          this.loggerService.trace(`[SW]: Downloading new app version: ${evt.version.hash}`);
          break;
        case 'VERSION_READY':
          this.loggerService.trace(`[SW]: Current app version: ${evt.currentVersion.hash}`);
          this.loggerService.trace(`[SW]: New app version ready for use: ${evt.latestVersion.hash}`);
          break;
        case 'VERSION_INSTALLATION_FAILED':
          this.loggerService.error(`[SW]: Failed to install app version '${evt.version.hash}': ${evt.error}`);
          break;
        case "NO_NEW_VERSION_DETECTED": {
          this.loggerService.trace(`[SW]: No new version detected`);
        }
      }
    });
  }
}
