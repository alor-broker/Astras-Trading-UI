import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';

@Component({
  selector: 'atsd-ai-chat-start-new-conversation-button',
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzIconDirective,
    NzTooltipDirective
  ],
  templateUrl: './ai-chat-start-new-conversation-button.html',
  styleUrl: './ai-chat-start-new-conversation-button.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatStartNewConversationButton {
  readonly atsDisabled = input(false);

  readonly clicked = output();
}
