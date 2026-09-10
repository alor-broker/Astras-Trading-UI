import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TextMessageContent} from '../../ai-chat.types';
import {AiChatTextMessage} from '../ai-chat-text-message/ai-chat-text-message';

@Component({
  selector: 'atsd-ai-chat-chat-suggested-message-container',
  imports: [
    AiChatTextMessage
  ],
  templateUrl: './ai-chat-chat-suggested-message-container.html',
  styleUrl: './ai-chat-chat-suggested-message-container.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatChatSuggestedMessageContainer {
  readonly suggestedMessage = input.required<TextMessageContent>();

  readonly selected = output<TextMessageContent>();
}
