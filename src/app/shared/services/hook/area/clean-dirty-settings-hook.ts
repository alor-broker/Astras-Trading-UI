import { AreaHook } from "./area-hook-token";
import { Injectable, inject } from "@angular/core";
import { ManageDashboardsService } from "../../manage-dashboards.service";
import { WidgetSettingsService } from "../../widget-settings.service";
import { LocalStorageService } from "../../local-storage.service";
import {
  USER_CONTEXT,
  UserContext
} from "../../auth/user-context";
import {
  combineLatest,
  defer,
  filter,
  Subscription,
  take,
  timer,
  withLatestFrom
} from "rxjs";
import { User } from "../../../models/user/user.model";
import {
  differenceInHours,
  formatISO,
  parseISO
} from "date-fns";
import { LoggerService } from "../../logging/logger.service";
import { mapWith } from "../../../utils/observable-helper";

@Injectable()
export class CleanDirtySettingsHook implements AreaHook {
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly userContext = inject<UserContext>(USER_CONTEXT);
  private readonly loggerService = inject(LoggerService);

  private subscription: Subscription | null = null;

  onDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onInit(): void {
    const lastState$ = defer(() => {
        return combineLatest({
          allDashboards: this.manageDashboardsService.allDashboards$,
          allWidgetSettings: this.widgetSettingsService.getAllSettings()
        }).pipe(
          take(1)
        );
      }
    );

    this.subscription = timer(2 * 60 * 1000, 30 * 60 * 1000).pipe(
      withLatestFrom(this.userContext.getUser()),
      filter(([, user]) => {
        const lastCheck = this.localStorageService.getItem<string>(this.getLastCheckStorageKey(user));

        if (lastCheck == null) {
          return true;
        }

        return differenceInHours(new Date(), parseISO(lastCheck)) > 24;
      }),
      mapWith(() => lastState$, (source, output) => ({user: source[1], state: output}))
    ).subscribe(x => {
      this.logMessage('Check for dirty settings');

      const existingSettings = new Set(x.state.allWidgetSettings.map(i => i.guid));
      const itemsToClean: { dashboardGuid: string, itemGuids: string[] }[] = [];

      for (const dashboard of x.state.allDashboards) {
        const itemsWithInitialSettings = dashboard.items.filter(i => i.initialSettings != null && existingSettings.has(i.guid));

        if (itemsWithInitialSettings.length > 0) {
          itemsToClean.push({
            dashboardGuid: dashboard.guid,
            itemGuids: itemsWithInitialSettings.map(x => x.guid)
          });
        }
      }

      if (itemsToClean.length > 0) {
        this.logMessage(`Clean ${itemsToClean.length} dashboards`);
        this.manageDashboardsService.removeInitialSettings(itemsToClean);
      } else {
        this.logMessage(`Nothing to clean`);
      }

      this.localStorageService.setItem(this.getLastCheckStorageKey(x.user), formatISO(new Date()));
    });
  }

  private getLastCheckStorageKey(user: User): string {
    return `dirty-settings-last-check.${user.login ?? ''}`;
  }

  private logMessage(message: string): void {
    this.loggerService.trace(`[CleanDirtySettingsHook]: ${message}`);
  }
}
