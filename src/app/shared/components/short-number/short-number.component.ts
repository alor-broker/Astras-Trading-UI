import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges
} from '@angular/core';
import {
  getNumberAbbreviation,
  NumberAbbreviation
} from "../../utils/number-abbreviation";
import { TranslocoDirective } from '@jsverse/transloco';
import { DecimalPipe } from '@angular/common';

@Component({
    selector: 'ats-short-number',
    templateUrl: './short-number.component.html',
    styleUrls: ['./short-number.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
      TranslocoDirective,
      DecimalPipe
    ]
})
export class ShortNumberComponent implements OnChanges {
  @Input() allowRounding = false;
  @Input() roundPrecision = 2;
  @Input() suffixForm: 'short' | 'long' = 'short';
  @Input({required: true}) value?: number | null | undefined;

  displayData: NumberAbbreviation | null = null;

  ngOnChanges(): void {
    this.displayData = getNumberAbbreviation(
      this.value,
      this.allowRounding,
      this.roundPrecision
    );
  }
}
