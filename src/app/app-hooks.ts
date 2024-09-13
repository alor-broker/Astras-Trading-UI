import { Provider } from "@angular/core";
import { APP_HOOK } from "./shared/services/hook/app/app-hook-token";
import { SwEventsLoggingHook } from "./shared/services/hook/app/sw-events-logging-hook";
import { TitleHook } from "./shared/services/hook/app/title-hook";

export const APP_HOOKS: Provider[] = [
  {
    provide: APP_HOOK,
    useClass: SwEventsLoggingHook,
    multi: true
  },
  {
    provide: APP_HOOK,
    useClass: TitleHook,
    multi: true
  },
];
