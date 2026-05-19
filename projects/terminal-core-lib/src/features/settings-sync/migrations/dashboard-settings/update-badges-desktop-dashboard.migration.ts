import {
  inject,
  Injectable
} from '@angular/core';
import {BaseBadges} from '../../../instruments/constants/badges.constants';
import {MarketService} from '../../../market-config/market.service';
import {
  ApplyOptions,
  ApplyStrategyType,
  MigrationBase
} from '../migration.types';
import {
  map,
  Observable,
  of
} from "rxjs";
import {
  OpPatch,
  ReplacePatch
} from "json-patch";
import {
  Dashboard,
  InstrumentGroups
} from '../../../dashboard/dashboard.types';
import {InstrumentKey} from '../../../../common/types/instrument.types';


@Injectable()
export class UpdateBadgesDesktopDashboardMigration extends MigrationBase {
  static OldToNewBadgesMap: { oldColor: string, newColor: string }[] = [
    {oldColor: 'yellow', newColor: BaseBadges[0]},
    {oldColor: 'blue', newColor: BaseBadges[5]},
    {oldColor: 'pink', newColor: BaseBadges[6]},
    {oldColor: 'red', newColor: BaseBadges[1]},
    {oldColor: 'orange', newColor: BaseBadges[2]},
  ];

  private readonly marketService = inject(MarketService);

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

          let exchangeSettings = marketSettings.find(x => x.settings.isDefault ?? false);
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
          if (patch) {
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
    if (currentBadges.length === BaseBadges.length
      && currentBadges.every(c => BaseBadges.includes(c))) {
      return null;
    }

    const updatedSelection: InstrumentGroups = {};

    BaseBadges.forEach(b => {
      updatedSelection[b] = defaultInstrument;
    });

    Object.keys(currentSelection).forEach(currentBadge => {
      const oldBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.find(x => x.oldColor === currentBadge);
      if (oldBadge != null) {
        if (currentSelection[oldBadge.newColor] == null) {
          updatedSelection[oldBadge.newColor] = currentSelection[currentBadge] ?? defaultInstrument;
        }
      } else {
        if (BaseBadges.includes(currentBadge)) {
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
