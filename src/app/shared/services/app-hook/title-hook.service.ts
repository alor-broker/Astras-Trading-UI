import { Injectable } from "@angular/core";
import { AppHook } from "./app-hook-token";
import { Subscription, switchMap } from "rxjs";
import { Title } from "@angular/platform-browser";
import { TranslatorService } from "../translator.service";
import { filter } from "rxjs/operators";

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
