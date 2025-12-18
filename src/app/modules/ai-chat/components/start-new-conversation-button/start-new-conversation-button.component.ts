import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';

@Component({
  selector: 'ats-start-new-conversation-button',
  templateUrl: './start-new-conversation-button.component.html',
  styleUrl: './start-new-conversation-button.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoDirective,
    NzButtonComponent,
    NzTooltipDirective,
    NzIconDirective
  ]
})
export class StartNewConversationButtonComponent {
  @Input()
  atsDisabled = false;

  @Output()
  clicked = new EventEmitter();
}
