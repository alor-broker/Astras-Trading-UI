import { Injectable } from "@angular/core";
import { Subscription, switchMap } from "rxjs";
import { Title } from "@angular/platform-browser";
import { filter } from "rxjs/operators";
import { TranslatorService } from "../../translator.service";
import { AppHook } from "./app-hook-token";

@Injectable()
export class TitleHook implements AppHook {
  private titleChangeSub?: Subscription | null = null;

  constructor(
    private readonly titleService: Title,
    private readonly translatorService: TranslatorService
  ) {
  }

  onDestroy(): void {
    this.titleChangeSub?.unsubscribe();
  }

  onInit(): void {
    this.titleChangeSub = this.translatorService.getEvents()
      .pipe(
        filter(e => e.type === 'translationLoadSuccess'),
        switchMap(() => this.translatorService.getTranslator(''))
      )
      .subscribe(t => {
        this.titleService.setTitle(t(['tabTitle']));
      });
  }
}
