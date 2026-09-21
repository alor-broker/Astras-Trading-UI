import {createActionGroup, createFeature, createReducer, emptyProps, on, props} from '@ngrx/store';
import {EntityStatus} from '../../../common/types/entity-status.types';
import {DashboardType} from '../../dashboard/types/dashboard.types';
import {WidgetsGalleryPreferences, WidgetsGallerySettings} from '../types/widgets-gallery-settings.types';
import {WidgetsGallerySettingsHelper} from '../utils/widgets-gallery-settings.helper';

export const WidgetsGalleryActions = createActionGroup({
  source: 'WidgetsGallery',
  events: {
    Load: emptyProps(),
    'Load Success': props<{settings: WidgetsGallerySettings}>(),
    'Load Failure': emptyProps(),
    Save: props<{dashboardType: DashboardType, preferences: WidgetsGalleryPreferences, requestId: string}>(),
    'Save Success': props<{settings: WidgetsGallerySettings, requestId: string}>(),
    'Save Failure': props<{requestId: string}>()
  }
});

export interface WidgetsGalleryState {
  settings: WidgetsGallerySettings;
  status: EntityStatus;
  saving: boolean;
}

const initialState: WidgetsGalleryState = {
  settings: WidgetsGallerySettingsHelper.empty(),
  status: EntityStatus.Initial,
  saving: false
};

export const WidgetsGalleryFeature = createFeature({
  name: 'WidgetsGallery',
  reducer: createReducer(initialState,
    on(WidgetsGalleryActions.load, state => ({...state, status: EntityStatus.Loading})),
    on(WidgetsGalleryActions.loadSuccess, (state, {settings}) => ({...state, settings, status: EntityStatus.Success})),
    on(WidgetsGalleryActions.loadFailure, state => ({...state, status: EntityStatus.Failure})),
    on(WidgetsGalleryActions.save, state => ({...state, saving: true})),
    on(WidgetsGalleryActions.saveSuccess, (state, {settings}) => ({...state, settings, saving: false})),
    on(WidgetsGalleryActions.saveFailure, state => ({...state, saving: false}))
  )
});
