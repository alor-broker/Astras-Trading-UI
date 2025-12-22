import {
  Component,
  input
} from '@angular/core';

export interface DisplayStatus {
  text: string;
}

@Component({
    selector: 'ats-chat-status',
    templateUrl: './chat-status.component.html',
    styleUrls: ['./chat-status.component.less']
})
export class ChatStatusComponent {
  readonly status = input.required<DisplayStatus | null>();
}
