import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-vertical-order-book[guid][shouldShowSettings]',
  templateUrl: './vertical-order-book.component.html',
  styleUrls: ['./vertical-order-book.component.less']
})
export class VerticalOrderBookComponent {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;

  constructor() {
  }
}
