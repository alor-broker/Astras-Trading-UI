import {InjectionToken} from '@angular/core';

export interface ExternalLinksConfig {
  reports?: string;
  releases?: string;
  support?: string;
  issuesList?: string;
  help?: string;
  officialSite?: string;
  riskRate?: string;
  personalAccount?: string;
  bankroll?: string;
  services?: string;
  videoTutorial?: string;
}

export const EXTERNAL_LINKS_CONFIG = new InjectionToken<ExternalLinksConfig>('ExternalLinksConfig');
