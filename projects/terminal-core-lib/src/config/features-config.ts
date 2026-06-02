import {InjectionToken} from '@angular/core';

export type FeaturesConfig = Record<string, boolean>;

export const FEATURES_CONFIG = new InjectionToken<FeaturesConfig>('FeaturesConfig');
