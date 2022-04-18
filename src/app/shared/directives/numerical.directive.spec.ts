/* tslint:disable:no-unused-variable */

import { ElementRef } from '@angular/core';
import { TestBed, async } from '@angular/core/testing';
import { NumericalDirective } from './numerical.directive';

describe('Directive: Numerical', () => {
  it('should create an instance', () => {
    const directive = new NumericalDirective(new ElementRef(null));
    expect(directive).toBeTruthy();
  });
});
