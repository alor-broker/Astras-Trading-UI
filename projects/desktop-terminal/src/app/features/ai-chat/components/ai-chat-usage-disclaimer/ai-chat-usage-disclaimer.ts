import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {TranslatorService} from '@terminal-core-lib/features/translations/services/translator.service';
import {
  map,
  switchMap
} from 'rxjs';
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {MarkdownComponent} from 'ngx-markdown';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'atsd-ai-chat-usage-disclaimer',
  imports: [
    NzAlertComponent,
    MarkdownComponent,
    AsyncPipe
  ],
  templateUrl: './ai-chat-usage-disclaimer.html',
  styleUrl: './ai-chat-usage-disclaimer.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatUsageDisclaimer {
  private readonly translatorService = inject(TranslatorService);

  readonly text$ = this.translatorService.getLangChanges().pipe(
    switchMap(() => this.translatorService.getTranslator('ai-chat/usage-disclaimer')),
    map(translator => translator(['text']))
  );
}
