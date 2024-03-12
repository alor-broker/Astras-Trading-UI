import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-side-chat-widget',
  templateUrl: './side-chat-widget.component.html',
  styleUrls: ['./side-chat-widget.component.less']
})
export class SideChatWidgetComponent {
  @Input({ required: true })
  atsVisible = false;

  @Output()
  atsVisibleChange = new EventEmitter<boolean>();

  close(): void {
    this.atsVisible = false;
    this.atsVisibleChange.emit(this.atsVisible);
  }
}
