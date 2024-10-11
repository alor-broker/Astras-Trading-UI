import {
  TranslocoTestingModule,
  TranslocoTestingOptions
} from "@jsverse/transloco";
import { ModuleWithProviders } from "@angular/core";
import ru from '../../../../assets/i18n/ru.json';

export class TranslocoTestsModule {
  static getModule(options: TranslocoTestingOptions = {}): ModuleWithProviders<TranslocoTestingModule> {
    const { langs } = options;

    return TranslocoTestingModule.forRoot({
      langs: { ru, ...langs },
      translocoConfig: {
        availableLangs: ['ru'],
        defaultLang: 'ru',
      },
      preloadLangs: true,
    });
  }
}
