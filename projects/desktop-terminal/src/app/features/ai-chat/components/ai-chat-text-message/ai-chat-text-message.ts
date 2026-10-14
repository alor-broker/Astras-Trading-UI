import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {TextMessageContent} from '../../ai-chat.types';
import {MarkdownComponent} from 'ngx-markdown';
import {AiChatChartsDirective} from '../../directives/ai-chat-charts.directive';
import {AiChatTablesDirective} from '../../directives/ai-chat-tables.directive';

@Component({
  selector: 'atsd-ai-chat-text-message',
  imports: [
    MarkdownComponent,
    AiChatChartsDirective,
    AiChatTablesDirective
  ],
  templateUrl: './ai-chat-text-message.html',
  styleUrl: './ai-chat-text-message.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatTextMessage {
  readonly content = input.required<TextMessageContent>();
}
