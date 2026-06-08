import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {
  Message,
  MessageType,
  TextMessageContent
} from '../../ai-chat.types';
import {
  animate,
  state,
  style,
  transition,
  trigger
} from '@angular/animations';
import {NzAvatarComponent} from 'ng-zorro-antd/avatar';
import {AiChatTextMessage} from '../ai-chat-text-message/ai-chat-text-message';

@Component({
  selector: 'atsd-ai-chat-message-container',
  imports: [
    NzAvatarComponent,
    AiChatTextMessage
  ],
  templateUrl: './ai-chat-message-container.html',
  host: {
    '[@flyIn]': 'true'
  },
  animations: [
    trigger('flyIn', [
      state('in', style({transform: 'translateX(0)', opacity: 1})),
      transition(':enter', [style({transform: 'translateX(-100%)', opacity: 0}), animate(100)]),
    ]),
  ],
  styleUrl: './ai-chat-message-container.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatMessageContainer {
  readonly message = input.required<Message<TextMessageContent>>();

  readonly messageTypes = MessageType;
}
