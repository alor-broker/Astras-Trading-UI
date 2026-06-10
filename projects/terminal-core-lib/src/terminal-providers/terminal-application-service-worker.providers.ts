import {EnvironmentProviders} from '@angular/core';
import {
  provideServiceWorker,
  SwRegistrationOptions
} from '@angular/service-worker';

export interface TerminalApplicationServiceWorkerOptions {
  enabled: boolean;
  registrationStrategy?: SwRegistrationOptions['registrationStrategy'];
  script?: string;
}

export function provideTerminalServiceWorker(
  options: TerminalApplicationServiceWorkerOptions
): EnvironmentProviders[] {
  return [
    provideServiceWorker(options.script ?? 'ngsw-worker.js', {
      enabled: options.enabled,
      registrationStrategy: options.registrationStrategy ?? 'registerWithDelay:60000',
    })
  ];
}
