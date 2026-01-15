import { Injectable, inject } from "@angular/core";
import { Subscription, switchMap } from "rxjs";
import { Title } from "@angular/platform-browser";
import { filter } from "rxjs/operators";
import { TranslatorService } from "../../translator.service";
import { AppHook } from "./app-hook-token";

@Injectable()
export class TitleHook implements AppHook {
  private readonly titleService = inject(Title);
  private readonly translatorService = inject(TranslatorService);

  private titleChangeSub?: Subscription | null = null;

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
