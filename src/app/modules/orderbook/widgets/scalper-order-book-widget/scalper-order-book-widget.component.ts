import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";

@Component({
  selector: 'ats-scalper-order-book-widget[shouldShowSettings][guid]',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less'],
  providers: [ScalperOrderBookService]
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
