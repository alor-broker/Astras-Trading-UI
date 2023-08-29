import {createFeatureSelector} from '@ngrx/store';
import * as fromWidgetSettings from './widget-settings.reducer';

export const selectWidgetSettingsState = createFeatureSelector<fromWidgetSettings.State>(
  fromWidgetSettings.widgetSettingsFeatureKey
);
