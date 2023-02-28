import {InjectionToken} from "@angular/core";

export interface AppHook {
  onInit(): void;

  onDestroy(): void;
}

export const APP_HOOK = new InjectionToken<AppHook[]>('AppHook');
