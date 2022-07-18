import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { OrderbookService } from "../../services/orderbook.service";

@Component({
  selector: 'ats-vertical-order-book-widget[shouldShowSettings][guid]',
  templateUrl: './vertical-order-book-widget.component.html',
  styleUrls: ['./vertical-order-book-widget.component.less'],
  providers: [OrderbookService]
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
