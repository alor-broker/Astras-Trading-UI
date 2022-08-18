import {
  Component,
  Input
} from '@angular/core';

@Component({
  selector: 'ats-order-submit[guid]',
  templateUrl: './order-submit.component.html',
  styleUrls: ['./order-submit.component.less']
})
export class OrderSubmitComponent {
  @Input()
  guid!: string;

  constructor() {
  }
}
