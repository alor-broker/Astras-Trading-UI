import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  Output
} from '@angular/core';
import { TextMessageContent } from "../../models/messages-display.model";
import {
  animate,
  state,
  style,
  transition,
  trigger
} from "@angular/animations";

@Component({
  selector: 'ats-chat-suggested-message-container',
  templateUrl: './chat-suggested-message-container.component.html',
  styleUrl: './chat-suggested-message-container.component.less',
  animations: [
    trigger('flyInOut', [
      state('in', style({transform: 'translateX(0)', opacity: 1})),
      transition(':enter', [style({transform: 'translateX(-100%)', opacity: 0}), animate(200)]),
      transition(':leave', [animate(200, style({transform: 'translateX(100%)', opacity: 0}))]),
    ]),
  ],
})
export class ChatSuggestedMessageContainerComponent {
  @Input({ required: true })
  suggestedMessage!: TextMessageContent;

  @Output()
  selected = new EventEmitter<TextMessageContent>();

  @HostBinding('@flyInOut')
  get flyInOut(): boolean {
    return true;
  }
}
