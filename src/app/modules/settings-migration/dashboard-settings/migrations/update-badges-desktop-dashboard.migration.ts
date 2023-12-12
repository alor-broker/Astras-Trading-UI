import {
  OpPatch,
  ReplacePatch
} from "json-patch";
import {
  Observable,
  of
} from "rxjs";
import { Injectable } from "@angular/core";
import { map } from "rxjs/operators";
import { instrumentsBadges } from "../../../../shared/utils/instruments";
import { MigrationBase } from "../../migration-base";
import { MarketService } from "../../../../shared/services/market.service";
import {
  Dashboard,
  InstrumentGroups
} from "../../../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import {
  ApplyOptions,
  ApplyStrategyType
} from "../../models/migration.model";

@Injectable({
  providedIn: "root"
})
export class UpdateBadgesDesktopDashboardMigration extends MigrationBase {
  static OldToNewBadgesMap: { oldColor: string, newColor: string }[] = [
    { oldColor: 'yellow', newColor: instrumentsBadges[0] },
    { oldColor: 'blue', newColor: instrumentsBadges[5] },
    { oldColor: 'pink', newColor: instrumentsBadges[6] },
    { oldColor: 'red', newColor: instrumentsBadges[1] },
    { oldColor: 'orange', newColor: instrumentsBadges[2] },
  ];

  constructor(private readonly marketService: MarketService) {
    super();
  }

  get migrationId(): string {
    return "update_badge_colors_dashboard";
  }

  get applyOptions(): ApplyOptions {
    // November 27, 2023
    const expirationDate = new Date(Date.UTC(2023, 10, 27));
    expirationDate.setMonth(expirationDate.getMonth() + 3);

    return {
      strategy: ApplyStrategyType.ApplyOnce,
      expirationDate: expirationDate
    };
  }

  getPatches(current: unknown): Observable<OpPatch[]> {
    if (!current || !Array.isArray(current)) {
      return of([]);
    }

    return this.marketService.getAllExchanges().pipe(
      map(marketSettings => {
        const patches: OpPatch[] = [];

        for (let index = 0; index < current.length; index++) {
          const item = current[index] as Dashboard;

          let exchangeSettings = marketSettings.find(x => x.settings.isDefault);
          if (item.selectedPortfolio != null) {
            exchangeSettings = marketSettings.find(x => x.exchange === item.selectedPortfolio!.exchange) ?? exchangeSettings;
          }

          if (!exchangeSettings || !exchangeSettings.settings.defaultInstrument) {
            continue;
          }

          const defaultInstrument: InstrumentKey = {
            ...exchangeSettings.settings.defaultInstrument,
            exchange: exchangeSettings.exchange
          };

          const patch = this.getPatchForItem(item, index, defaultInstrument);
          if (!!patch) {
            patches.push(patch);
          }
        }

        return patches;
      })
    );
  }

  private getPatchForItem(item: Dashboard, itemIndex: number, defaultInstrument: InstrumentKey): OpPatch | null {
    const currentSelection = item.instrumentsSelection;
    if (!currentSelection) {
      return null;
    }

    const currentBadges = Object.keys(currentSelection);
    if(currentBadges.length === instrumentsBadges.length
    && currentBadges.every(c => instrumentsBadges.includes(c))) {
      return null;
    }

    const updatedSelection: InstrumentGroups = {};

    instrumentsBadges.forEach(b => {
      updatedSelection[b] = defaultInstrument;
    });

    Object.keys(currentSelection).forEach(currentBadge => {
      const oldBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.find(x => x.oldColor === currentBadge);
      if (oldBadge != null) {
        if (currentSelection[oldBadge.newColor] == null) {
          updatedSelection[oldBadge.newColor] = currentSelection[currentBadge] ?? defaultInstrument;
        }
      } else {
        if (instrumentsBadges.includes(currentBadge)) {
          if (updatedSelection[currentBadge] !== currentSelection[currentBadge]) {
            updatedSelection[currentBadge] = currentSelection[currentBadge] ?? updatedSelection[currentBadge];
          }
        }
      }
    });

    return {
      op: 'replace',
      path: `/${itemIndex}/instrumentsSelection`,
      value: updatedSelection
    } as ReplacePatch;
  }
}
