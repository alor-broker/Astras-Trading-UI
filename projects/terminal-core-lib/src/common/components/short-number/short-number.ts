import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnChanges,
  ViewEncapsulation
} from '@angular/core';
import {
  NumberAbbreviation,
  NumberAbbreviationHelper
} from '../../utils/number-abbreviation.helper';
import {TranslocoDirective} from '@jsverse/transloco';
import {DecimalPipe} from '@angular/common';

@Component({
  selector: 'ats-short-number',
  imports: [
    TranslocoDirective,
    DecimalPipe
  ],
  templateUrl: './short-number.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShortNumber implements OnChanges {
  readonly allowRounding = input(false);

  readonly roundPrecision = input(2);

  readonly suffixForm = input<'short' | 'long'>('short');

  readonly value = input.required<number | null | undefined>();

  displayData: NumberAbbreviation | null = null;

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnChanges(): void {
    this.displayData = NumberAbbreviationHelper.getNumberAbbreviation(
      this.value(),
      this.allowRounding(),
      this.roundPrecision()
    );

    this.cdr.markForCheck();
  }
}
