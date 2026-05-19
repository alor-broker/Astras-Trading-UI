import {
  createEntityAdapter,
  EntityAdapter,
  EntityState,
  Update
} from '@ngrx/entity';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {WidgetSettings} from '../widget-settings.types';
import {
  createFeature,
  createReducer,
  on
} from "@ngrx/store";
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from './actions';
import {DefaultBadge} from '../../instruments/constants/badges.constants';
import {PortfolioKey} from '../../../common/types/portfolio.types';

export interface State extends EntityState<WidgetSettings> {
  status: EntityStatus;
}

export const adapter: EntityAdapter<WidgetSettings> = createEntityAdapter<WidgetSettings>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});

const reducer = createReducer(
  initialState,

  on(WidgetSettingsInternalActions.init, (state, {settings}) => {
    return adapter.addMany(
      settings,
      {
        ...state,
        status: EntityStatus.Success
      });
  }),

  on(WidgetSettingsServiceActions.add, (state, {settings}) => {
    return adapter.addMany(settings, state);
  }),

  on(
    WidgetSettingsServiceActions.updateInstrument,
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
        } as Update<WidgetSettings>)),
        state
      );
    }
  ),

  on(
    WidgetSettingsInternalActions.setDefaultBadges,
    (state, {
      settingGuids
    }) => {
      const updates: Update<WidgetSettings>[] = [];
      settingGuids.forEach(s => updates.push({
        id: s,
        changes: {
          badgeColor: DefaultBadge
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
    WidgetSettingsServiceActions.updatePortfolio,
    (state, {
      settingGuids,
      newPortfolioKey
    }) => {
      const updates: Update<WidgetSettings & PortfolioKey>[] = [];
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

  on(WidgetSettingsServiceActions.updateContent, (state, {settingGuid, changes}) => {
      return adapter.updateOne(
        {id: settingGuid, changes},
        state
      );
    }
  ),

  on(WidgetSettingsServiceActions.remove, (state, {settingGuids}) => {
    return adapter.removeMany(settingGuids, state);
  }),

  on(WidgetSettingsServiceActions.removeAll, state => {
    return adapter.removeAll(state);
  })
);

export const WidgetSettingsFeature = createFeature({
  name: 'WidgetSettings',
  reducer
});
