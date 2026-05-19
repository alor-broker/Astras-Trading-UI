import {
  EnvironmentProviders,
  InjectionToken,
  makeEnvironmentProviders
} from '@angular/core';
import {TranslationsLoaderService} from './services/translations-loader.service';
import {MissingTranslationsHandler} from './services/missing-translations-handler';
import {
  provideTransloco,
  TRANSLOCO_MISSING_HANDLER
} from '@jsverse/transloco';
import {TranslatorService} from './services/translator.service';
import {LocaleService} from '@terminal-core-lib/features/translations/services/locale.service';

export type LanguagesConfig = Record<string, { title: string }>;

export const LANGUAGES_CONFIG = new InjectionToken<LanguagesConfig>('AVAILABLE_LANGUAGES');

export function provideTranslations(isProd: boolean): EnvironmentProviders {
  return makeEnvironmentProviders([
    TranslationsLoaderService,
    provideTransloco(
      {
        config: {
          availableLangs: ['ru', 'en', 'hy'],
          defaultLang: 'ru',
          reRenderOnLangChange: true,
          prodMode: isProd,
        },
        loader: TranslationsLoaderService
      }
    ),
    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: MissingTranslationsHandler
    },
    TranslatorService,
    LocaleService
  ]);
}
