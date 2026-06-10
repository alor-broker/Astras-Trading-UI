import {
  inject,
  Injectable
} from "@angular/core";
import {DOCUMENT} from '@angular/common';
import {
  distinct,
  filter,
  map
} from "rxjs/operators";
import {
  Subscription,
  tap
} from "rxjs";
import {
  en_US,
  hy_AM,
  NzI18nInterface,
  NzI18nService,
  ru_RU
} from "ng-zorro-antd/i18n";
import {Hook} from '../../../common/types/hook.types';
import {TerminalSettingsService} from '../../terminal-settings/services/terminal-settings.service';
import {TranslatorService} from '../services/translator.service';
import {LocaleService} from '../services/locale.service';
import {rusLangLocales} from '../constants/rus-lang-locales.constants';

@Injectable()
export class TranslationHook implements Hook {
  private readonly terminalSettings = inject(TerminalSettingsService);

  private readonly translatorService = inject(TranslatorService);

  private readonly localeService = inject(LocaleService);

  private readonly nzI18nService = inject(NzI18nService);

  private readonly document = inject(DOCUMENT);

  private langChangeSubscription?: Subscription;

  onDestroy(): void {
    this.langChangeSubscription?.unsubscribe();
  }

  onInit(): void {
    this.langChangeSubscription = this.terminalSettings.getSettings()
      .pipe(
        tap(settings => {
          if (settings.language) {
            return;
          }

          this.terminalSettings.updateSettings({
            language: rusLangLocales.includes(navigator.language.toLowerCase())
              ? 'ru'
              : 'en'
          });
        }),
        map(settings => settings.language),
        filter(lang => lang != null),
      )
      .subscribe(lang => {
        this.translatorService.setActiveLang(lang);
        this.document.documentElement.lang = lang;
      });

    this.langChangeSubscription.add(
      this.terminalSettings.getSettings().pipe(
        map(s => s.language ?? this.localeService.defaultLocale),
        distinct()
      ).subscribe(locale => {
        this.localeService.setLocale(locale);

        this.nzI18nService.setLocale(this.getNzI18nInterface(locale));
      })
    );
  }

  private getNzI18nInterface(localeId: string): NzI18nInterface {
    switch (localeId) {
      case 'en':
        return en_US;
      case 'ru':
        return ru_RU;
      case 'hy':
        return hy_AM;
      default:
        return ru_RU;
    }
  }
}
