import { Provider } from "@angular/core";
import { AREA_HOOK } from "../shared/services/hook/area/area-hook-token";
import { ApplyDesignSettingsHook } from "../shared/services/hook/area/apply-design-settings-hook.service";
import { LoggingHook } from "../shared/services/hook/area/logging-hook";
import { TranslationHook } from "../shared/services/hook/area/translation-hook";

export const AREA_HOOKS: Provider[] = [
  {
    provide: AREA_HOOK,
    useClass: ApplyDesignSettingsHook,
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
