import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-orders-basket-widget[guid]',
  templateUrl: './orders-basket-widget.component.html',
  styleUrls: ['./orders-basket-widget.component.less']
})
export class OrdersBasketWidgetComponent {
  @Input()
  guid!: string;

  constructor() {
  }
}
