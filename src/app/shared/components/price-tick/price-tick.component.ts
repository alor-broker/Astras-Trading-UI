import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'ats-price-tick',
  templateUrl: './price-tick.component.html',
  styleUrls: ['./price-tick.component.less']
})
export class PriceTickComponent implements OnInit, OnChanges {
  @Input({required: true})
  prevPrice = 0;
  @Input({required: true})
  price = 0;

  changingColorPart = '';
  mainPart = '';
  isUp = true;

  ngOnInit(): void {
    this.recolor();
  }

  ngOnChanges(): void {
    this.recolor();
  }

  private recolor(): void {
    if (!this.price) {
      return;
    }
    const parts = this.price.toString().split('.');
    this.mainPart = parts[0] + '.';
    this.changingColorPart = parts[1];
    if (!this.changingColorPart) {
      this.changingColorPart = '0';
    }
    this.isUp = this.price - this.prevPrice >= 0;
  }
}
