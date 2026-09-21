import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {provideState} from '@ngrx/store';
import {provideEffects} from '@ngrx/effects';
import {WidgetsGalleryFeature} from '@terminal-core-lib/features/widgets-gallery/store/widgets-gallery.store';
import {WidgetsGalleryEffects} from '@terminal-core-lib/features/widgets-gallery/store/widgets-gallery.effects';
import {WidgetsGallerySettingsService} from '@terminal-core-lib/features/widgets-gallery/services/widgets-gallery-settings.service';
import {WIDGETS_GALLERY_STORAGE} from '@terminal-core-lib/features/widgets-gallery/types/widgets-gallery-settings.types';
import {WidgetsGallerySettingsBrokerService} from './widgets-gallery-settings-broker.service';

export function provideWidgetsGallerySettings(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideState(WidgetsGalleryFeature),
    provideEffects(WidgetsGalleryEffects),
    WidgetsGallerySettingsService,
    {provide: WIDGETS_GALLERY_STORAGE, useClass: WidgetsGallerySettingsBrokerService}
  ]);
}
