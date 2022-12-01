import {
  createReducer,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from "@ngrx/entity";
import { AnySettings } from "../../shared/models/settings/any-settings.model";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import * as WidgetSettingsActions from "./widget-settings.actions";
import { Update } from "@ngrx/entity/src/models";
import { defaultBadgeColor } from "../../shared/utils/instruments";

export const widgetSettingsFeatureKey = 'widgetSettings';

export interface State extends EntityState<AnySettings> {
  status: EntityStatus
}

export const adapter: EntityAdapter<AnySettings> = createEntityAdapter<AnySettings>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});


export const reducer = createReducer(
  initialState,

  on(WidgetSettingsActions.initWidgetSettings, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(WidgetSettingsActions.initWidgetSettingsSuccess, (state, { settings }) => {
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
    WidgetSettingsActions.updateWidgetSettingsInstrumentWithBadge,
    (state, {
      settingGuids,
      badges
    }) => {
      const updates: Update<AnySettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          ...state.entities[s],
          symbol: badges[state.entities[s]?.badgeColor!]?.symbol,
          exchange: badges[state.entities[s]?.badgeColor!]?.exchange,
          instrumentGroup: badges[state.entities[s]?.badgeColor!]?.instrumentGroup,
          isin: badges[state.entities[s]?.badgeColor!]?.isin,
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
    WidgetSettingsActions.setDefaultBadges,
    (state, {
      settingGuids
    }) => {
      const updates: Update<AnySettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          ...state.entities[s],
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
      const updates: Update<AnySettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          ...state.entities[s],
          portfolio: newPortfolioKey.portfolio,
          exchange: newPortfolioKey.exchange,
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

  on(WidgetSettingsActions.removeWidgetSettings, (state, { settingGuid }) => {
    return adapter.removeOne(settingGuid, state);
  }),

  on(WidgetSettingsActions.removeAllWidgetSettings, state => {
    return adapter.removeAll(state);
  })
);

