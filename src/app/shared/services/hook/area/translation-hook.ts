import {Injectable} from "@angular/core";
import {filter, map} from "rxjs/operators";
import {en_US, NzI18nService, ru_RU} from "ng-zorro-antd/i18n";
import {Subscription, tap} from "rxjs";
import { TerminalSettingsService } from "../../terminal-settings.service";
import { TranslatorService } from "../../translator.service";
import { rusLangLocales } from "../../../utils/translation-helper";
import { AreaHook } from "./area-hook-token";

@Injectable()
export class TranslationHook implements AreaHook {
  private langChangeSubscription?: Subscription;

  constructor(
    private readonly terminalSettings: TerminalSettingsService,
    private readonly translatorService: TranslatorService,
    private readonly nzI18nService: NzI18nService,
  ) {
  }

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
        this.nzI18nService.setLocale(lang === 'en' ? en_US : ru_RU);
      });
  }
}
