import { ElementRef } from '@angular/core';
import { NumericalDirective } from './numerical.directive';

describe('Directive: Numerical', () => {
  it('should create an instance', () => {
    const directive = new NumericalDirective(new ElementRef(null));
    expect(directive).toBeTruthy();
  });
});
