import {
  Component,
  HostBinding,
  Input
} from '@angular/core';
import {
  Message,
  MessageType
} from "../../models/messages-display.model";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";

@Component({
  selector: 'ats-chat-message-container',
  templateUrl: './chat-message-container.component.html',
  styleUrls: ['./chat-message-container.component.less'],
  animations: [
    trigger('flyIn', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition(':enter', [style({ transform: 'translateX(-100%)', opacity: 0 }), animate(100)]),
    ]),
  ],
})
export class ChatMessageContainerComponent {
  @Input({ required: true })
  message!: Message<any>;

  readonly messageTypes = MessageType;

  @HostBinding('@flyIn')
  get flyIn(): boolean {
    return true;
  }
}
