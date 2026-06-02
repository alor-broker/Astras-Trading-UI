import {
  inject,
  Injectable
} from '@angular/core';
import {Hook} from '../types/hook.types';
import {Title} from '@angular/platform-browser';
import {TranslatorService} from '../../features/translations/services/translator.service';
import {
  Subscription,
  switchMap
} from 'rxjs';
import {filter} from 'rxjs/operators';

@Injectable()
export class TitleHook implements Hook {
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
