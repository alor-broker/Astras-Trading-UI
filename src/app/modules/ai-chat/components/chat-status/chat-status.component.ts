import {
  Component,
  Input
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
  @Input({ required: true })
  status: DisplayStatus | null = null;
}
