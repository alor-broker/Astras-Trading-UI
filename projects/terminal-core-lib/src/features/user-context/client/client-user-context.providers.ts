import {Provider} from '@angular/core';
import {ClientAuthService} from '@terminal-core-lib/features/user-context/client/services/client-auth.service';
import {
  SESSION_CONTEXT,
  USER_CONTEXT
} from "../user-context.types";

export function provideClientUserContext(): Provider[] {
  return [
    ClientAuthService,
    {
      provide: USER_CONTEXT,
      useExisting: ClientAuthService
    },
    {
      provide: SESSION_CONTEXT,
      useExisting: ClientAuthService
    }
  ];
}
