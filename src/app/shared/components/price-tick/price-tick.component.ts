import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'ats-price-tick[prevPrice][price]',
  templateUrl: './price-tick.component.html',
  styleUrls: ['./price-tick.component.less']
})
export class PriceTickComponent implements OnInit, OnChanges {
  @Input()
  prevPrice: number = 0;
  @Input()
  price: number = 0;

  changingColorPart: string = '';
  mainPart: string = '';
  isUp: boolean = true;

  constructor() { }

  ngOnInit(): void {
    this.recolor();
  }

  ngOnChanges() {
    this.recolor();
  }

  private recolor() {
    if (!this.price) {
      return;
    }
    const parts = this.price.toString()?.split('.');
    this.mainPart = parts[0] + '.';
    this.changingColorPart = parts[1];
    if (!this.changingColorPart) {
      this.changingColorPart = '0';
    }
    this.isUp = this.price - this.prevPrice >= 0;
  }
}
