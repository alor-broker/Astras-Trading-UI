import {
  Component,
  EventEmitter,
  Input,
  Output
} from '@angular/core';

@Component({
  selector: 'ats-limit-order-price-change',
  templateUrl: './limit-order-price-change.component.html',
  styleUrls: ['./limit-order-price-change.component.less']
})
export class LimitOrderPriceChangeComponent {
  @Input()
  disabled: boolean = false;

  @Input()
  disabledTooltip?: string;

  @Input()
  steps: number[] = [];

  @Output()
  stepClick = new EventEmitter<number>();

  constructor() {
  }

  get sortedSteps(): number[] {
    return [...this.steps].sort((a, b) => a - b);
  }

}
