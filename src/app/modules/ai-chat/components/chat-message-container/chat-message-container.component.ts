import {Component, HostBinding, input} from '@angular/core';
import {Message, MessageType} from "../../models/messages-display.model";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {NgClass} from '@angular/common';
import {NzAvatarComponent} from 'ng-zorro-antd/avatar';
import {TextMessageComponent} from '../messages/text-message/text-message.component';

@Component({
  selector: 'ats-chat-message-container',
  templateUrl: './chat-message-container.component.html',
  styleUrls: ['./chat-message-container.component.less'],
  animations: [
    trigger('flyIn', [
      state('in', style({transform: 'translateX(0)', opacity: 1})),
      transition(':enter', [style({transform: 'translateX(-100%)', opacity: 0}), animate(100)]),
    ]),
  ],
  imports: [
    NgClass,
    NzAvatarComponent,
    TextMessageComponent
  ]
})
export class ChatMessageContainerComponent {
  readonly message = input.required<Message<any>>();

  readonly messageTypes = MessageType;

  @HostBinding('@flyIn')
  readonly flyIn = true;
}
