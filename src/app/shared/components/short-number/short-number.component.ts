import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormatToBase, MathHelper } from "../../utils/math-helper";

@Component({
  selector: 'ats-short-number',
  templateUrl: './short-number.component.html',
  styleUrls: ['./short-number.component.less']
})
export class ShortNumberComponent implements OnChanges {
  @Input() allowRounding = false;
  @Input() roundPrecision = 2;
  @Input() suffixForm: 'short' | 'long' = 'short';
  @Input() value?: number;

  displayData: FormatToBase | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      this.displayData = MathHelper.getBaseNumber(
        this.value,
        this.allowRounding,
        this.roundPrecision
      );
    }
  }
}
