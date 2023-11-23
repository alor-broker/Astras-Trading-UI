import {
  createReducer,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from "@ngrx/entity";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import * as WidgetSettingsActions from "./widget-settings.actions";
import { Update } from "@ngrx/entity/src/models";
import { defaultBadgeColor } from "../../shared/utils/instruments";
import { WidgetSettings } from '../../shared/models/widget-settings.model';

export const widgetSettingsFeatureKey = 'widgetSettings';

export interface State extends EntityState<WidgetSettings> {
  status: EntityStatus;
}

export const adapter: EntityAdapter<WidgetSettings> = createEntityAdapter<WidgetSettings>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});


export const reducer = createReducer(
  initialState,

  on(WidgetSettingsActions.initWidgetSettings, (state, { settings }) => {
    return adapter.addMany(
      settings,
      {
        ...state,
        status: EntityStatus.Success
      });
  }),

  on(WidgetSettingsActions.addWidgetSettings, (state, { settings }) => {
    return adapter.addMany(settings, state);
  }),

  on(
    WidgetSettingsActions.updateWidgetSettingsInstrument,
    (state, props) => {
      return adapter.updateMany(
        props.updates.map(u => ({
          id: u.guid,
          changes: {
            symbol: u.instrumentKey.symbol,
            exchange: u.instrumentKey.exchange,
            instrumentGroup: u.instrumentKey.instrumentGroup,
            isin: u.instrumentKey.isin
          }
        })),
        state
      );
    }
  ),

  on(
    WidgetSettingsActions.setDefaultBadges,
    (state, {
      settingGuids
    }) => {
      const updates: Update<WidgetSettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          badgeColor: defaultBadgeColor
        }
      }));

      if (updates.length > 0) {
        return adapter.updateMany(
          updates,
          state
        );
      }

      return state;
    }
  ),

  on(
    WidgetSettingsActions.updateWidgetSettingsPortfolio,
    (state, {
      settingGuids,
      newPortfolioKey
    }) => {
      const updates: Update<WidgetSettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          portfolio: newPortfolioKey.portfolio,
          exchange: newPortfolioKey.exchange,
          marketType: newPortfolioKey.marketType
        }
      }));

      if (updates.length > 0) {
        return adapter.updateMany(
          updates,
          state
        );
      }

      return state;
    }
  ),

  on(WidgetSettingsActions.updateWidgetSettings, (state, { settingGuid, changes }) => {
      return adapter.updateOne(
        { id: settingGuid, changes },
        state
      );
    }
  ),

  on(WidgetSettingsActions.removeWidgetSettings, (state, { settingGuids }) => {
    return adapter.removeMany(settingGuids, state);
  }),

  on(WidgetSettingsActions.removeAllWidgetSettings, state => {
    return adapter.removeAll(state);
  })
);

