import { Injectable, inject } from "@angular/core";
import {
  distinct,
  filter,
  map
} from "rxjs/operators";
import {Subscription, tap} from "rxjs";
import { TerminalSettingsService } from "../../terminal-settings.service";
import { TranslatorService } from "../../translator.service";
import { rusLangLocales } from "../../../utils/translation-helper";
import { AreaHook } from "./area-hook-token";
import { LocaleService } from "../../locale.service";
import {
  en_US,
  hy_AM,
  NzI18nInterface,
  NzI18nService,
  ru_RU
} from "ng-zorro-antd/i18n";

@Injectable()
export class TranslationHook implements AreaHook {
  private readonly terminalSettings = inject(TerminalSettingsService);
  private readonly translatorService = inject(TranslatorService);
  private readonly localeService = inject(LocaleService);
  private readonly nzI18nService = inject(NzI18nService);

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
        filter(lang => !!lang),
      )
      .subscribe(lang => {
        this.translatorService.setActiveLang(lang!);
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
