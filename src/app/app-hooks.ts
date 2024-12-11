import { Provider } from "@angular/core";
import { APP_HOOK } from "./shared/services/hook/app/app-hook-token";
import { SwEventsLoggingHook } from "./shared/services/hook/app/sw-events-logging-hook";
import { TitleHook } from "./shared/services/hook/app/title-hook";
import {AttachDefaultStylesHook} from "./shared/services/hook/app/attach-default-styles-hook";
import { InstrumentSelectDialogHook } from "./shared/services/hook/app/instrument-select-dialog.hook";

export const APP_HOOKS: Provider[] = [
  {
    provide: APP_HOOK,
    useClass: AttachDefaultStylesHook,
    multi: true
  },
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
  {
    provide: APP_HOOK,
    useClass: InstrumentSelectDialogHook,
    multi: true
  },
];
