import {
  Component,
  Input
} from '@angular/core';
import { TextMessageContent } from "../../../models/messages-display.model";

@Component({
    selector: 'ats-text-message',
    templateUrl: './text-message.component.html',
    styleUrls: ['./text-message.component.less'],
    standalone: false
})
export class TextMessageComponent {
  @Input({required: true})
  content!: TextMessageContent;
}
