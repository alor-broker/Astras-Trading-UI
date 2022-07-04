import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-vertical-order-book-widget[shouldShowSettings][guid]',
  templateUrl: './vertical-order-book-widget.component.html',
  styleUrls: ['./vertical-order-book-widget.component.less']
})
export class VerticalOrderBookWidgetComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor() {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }
}
