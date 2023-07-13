import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { getNumberAbbreviation, NumberAbbreviation } from "../../utils/number-abbreviation";

@Component({
  selector: 'ats-short-number',
  templateUrl: './short-number.component.html',
  styleUrls: ['./short-number.component.less']
})
export class ShortNumberComponent implements OnChanges {
  @Input() allowRounding = false;
  @Input() roundPrecision = 2;
  @Input() suffixForm: 'short' | 'long' = 'short';
  @Input({required: true}) value?: number | null | undefined;

  displayData: NumberAbbreviation | null = null;

  ngOnChanges(changes: SimpleChanges) {
    if (changes) {
      this.displayData = getNumberAbbreviation(
        this.value,
        this.allowRounding,
        this.roundPrecision
      );
    }
  }
}
