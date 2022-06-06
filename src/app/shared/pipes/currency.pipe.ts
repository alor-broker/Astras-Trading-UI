import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'atsCurrency'
})
export class CurrencyPipe implements PipeTransform {

  transform(value: number, currencyCode: string): string {
    if(value == null) {
      return '';
    }

    return `${this.getSymbol(currencyCode)}${value}`;
  }

  private getSymbol(currencyCode: string) {
    switch (currencyCode) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'RUB':
      case 'RUR':
      default:
        return '₽';
    }
  }
}
