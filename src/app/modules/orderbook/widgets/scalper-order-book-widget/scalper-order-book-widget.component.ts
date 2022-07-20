import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { OrderbookService } from "../../services/orderbook.service";

@Component({
  selector: 'ats-scalper-order-book-widget[shouldShowSettings][guid]',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less'],
  providers: [OrderbookService]
})
export class ScalperOrderBookWidgetComponent {
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
