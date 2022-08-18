import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-order-submit-widget[shouldShowSettings][guid]',
  templateUrl: './order-submit-widget.component.html',
  styleUrls: ['./order-submit-widget.component.less']
})
export class OrderSubmitWidgetComponent {
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
