import {
  Component,
  Input
} from '@angular/core';
import { TextMessageContent } from "../../../models/messages-display.model";
import { MarkdownComponent } from 'ngx-markdown';

@Component({
    selector: 'ats-text-message',
    templateUrl: './text-message.component.html',
    styleUrls: ['./text-message.component.less'],
    imports: [MarkdownComponent]
})
export class TextMessageComponent {
  @Input({required: true})
  content!: TextMessageContent;
}
