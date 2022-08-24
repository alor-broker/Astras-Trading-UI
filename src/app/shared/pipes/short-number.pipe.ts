import {
  Pipe,
  PipeTransform
} from '@angular/core';

@Pipe({
  name: 'shortNumber'
})
export class ShortNumberPipe implements PipeTransform {

  transform(value?: number | null): string {
    if (!value) {
      return '';
    }

    if (value % 1000 === 0) {
      return `${value / 1000}К`;
    }

    return value.toString();
  }

}
