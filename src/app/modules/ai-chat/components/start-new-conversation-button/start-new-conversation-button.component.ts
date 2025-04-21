import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
    selector: 'ats-start-new-conversation-button',
    templateUrl: './start-new-conversation-button.component.html',
    styleUrl: './start-new-conversation-button.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class StartNewConversationButtonComponent {
  @Input()
  atsDisabled = false;

  @Output()
  clicked = new EventEmitter();
}
