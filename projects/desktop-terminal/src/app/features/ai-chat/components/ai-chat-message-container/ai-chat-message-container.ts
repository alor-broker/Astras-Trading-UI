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
import {NzAvatarComponent} from 'ng-zorro-antd/avatar';
import {AiChatTextMessage} from '../ai-chat-text-message/ai-chat-text-message';

@Component({
  selector: 'atsd-ai-chat-message-container',
  imports: [
    NzAvatarComponent,
    AiChatTextMessage
  ],
  templateUrl: './ai-chat-message-container.html',
  styleUrl: './ai-chat-message-container.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatMessageContainer {
  readonly message = input.required<Message<TextMessageContent>>();

  readonly messageTypes = MessageType;
}
