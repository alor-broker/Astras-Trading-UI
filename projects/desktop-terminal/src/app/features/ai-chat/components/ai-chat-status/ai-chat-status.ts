import {
  ChangeDetectionStrategy,
  Component,
  input,
  ViewEncapsulation
} from '@angular/core';
import {DisplayStatus} from '../../ai-chat.types';

@Component({
  selector: 'atsd-ai-chat-status',
  imports: [],
  templateUrl: './ai-chat-status.html',
  styleUrl: './ai-chat-status.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatStatus {
  readonly status = input.required<DisplayStatus | null>();
}
