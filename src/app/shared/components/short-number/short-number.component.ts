import {
  ChangeDetectionStrategy,
  Component,
  OnChanges,
  input
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
  readonly allowRounding = input(false);
  readonly roundPrecision = input(2);
  readonly suffixForm = input<'short' | 'long'>('short');
  readonly value = input.required<number | null | undefined>();

  displayData: NumberAbbreviation | null = null;

  ngOnChanges(): void {
    this.displayData = getNumberAbbreviation(
      this.value(),
      this.allowRounding(),
      this.roundPrecision()
    );
  }
}
