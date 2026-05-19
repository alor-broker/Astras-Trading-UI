import {
  ChangeDetectionStrategy,
  Component,
  HostBinding,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TextMessageContent} from '../../ai-chat.types';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
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
  animations: [
    trigger('flyInOut', [
      state('in', style({transform: 'translateX(0)', opacity: 1})),
      transition(':enter', [style({transform: 'translateX(-100%)', opacity: 0}), animate(200)]),
      transition(':leave', [animate(200, style({transform: 'translateX(100%)', opacity: 0}))]),
    ]),
  ],
})
export class AiChatChatSuggestedMessageContainer {
  readonly suggestedMessage = input.required<TextMessageContent>();

  readonly selected = output<TextMessageContent>();

  @HostBinding('@flyInOut')
  readonly flyInOut = true;
}
