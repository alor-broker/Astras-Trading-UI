import {Provider} from '@angular/core';
import {of} from 'rxjs';
import {ApplicationStatusService} from '@terminal-core-lib/common/services/application-status.service';

export interface ApplicationStatusServiceMockResult {
  provider: Provider;
}

export class ApplicationStatusServiceMockFactory {
  static create(isActive = true): ApplicationStatusServiceMockResult {
    return {
      provider: {provide: ApplicationStatusService, useValue: {isActive$: of(isActive)}}
    };
  }
}
