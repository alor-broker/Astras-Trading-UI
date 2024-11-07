import { InjectionToken } from "@angular/core";

export interface AreaHook {
  onInit(): void;
  onDestroy(): void;
}

export const AREA_HOOK = new InjectionToken<AreaHook[]>('AreaHook');
