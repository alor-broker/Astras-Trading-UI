import {InjectionToken} from '@angular/core';

export type DebugConfig = Record<string, boolean>;

export const DEBUG_CONFIG = new InjectionToken<DebugConfig>('DebugConfig');
