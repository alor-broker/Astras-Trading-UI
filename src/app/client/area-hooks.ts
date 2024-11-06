import { Provider } from "@angular/core";
import { AREA_HOOK } from "../shared/services/hook/area/area-hook-token";
import { InitQueryParamsHook } from "../shared/services/hook/area/init-query-params-hook";
import { MobileHook } from "../shared/services/hook/area/mobile-hook";
import { AppSessionTrackHook } from "../shared/services/session/app-session-track-hook";
import { LoggingHook } from "../shared/services/hook/area/logging-hook";
import { TranslationHook } from "../shared/services/hook/area/translation-hook";
import {ApplyDesignSettingsHook} from "../shared/services/hook/area/apply-design-settings-hook";

export const AREA_HOOKS: Provider[] = [
  {
    provide: AREA_HOOK,
    useClass: ApplyDesignSettingsHook,
    multi: true
  },
  {
    provide: AREA_HOOK,
    useClass: InitQueryParamsHook,
    multi: true
  },
  {
    provide: AREA_HOOK,
    useClass: MobileHook,
    multi: true
  },
  {
    provide: AREA_HOOK,
    useClass: AppSessionTrackHook,
    multi: true
  },
  {
    provide: AREA_HOOK,
    useClass: LoggingHook,
    multi: true
  },
  {
    provide: AREA_HOOK,
    useClass: TranslationHook,
    multi: true
  }
];
