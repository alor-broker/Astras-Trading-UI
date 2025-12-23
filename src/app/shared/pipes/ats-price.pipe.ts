import { LOCALE_ID, Pipe, PipeTransform, inject } from '@angular/core';
import {DecimalPipe} from "@angular/common";

@Pipe({ name: 'atsPrice' })
export class AtsPricePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  private readonly numberPipe = new DecimalPipe(this.locale);

  transform(value: number | null | undefined, decimalSymbolCount?: number | null): string | null {
    if(value == null) {
      return null;
    }

    if(decimalSymbolCount != null) {
      return this.numberPipe.transform(value, `1.${decimalSymbolCount}-${decimalSymbolCount}`);
    }

    return this.numberPipe.transform(value, `1.0-10`);
  }
}
