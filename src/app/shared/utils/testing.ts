import { defer } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';
import {
  Component,
  Directive,
  EventEmitter,
  ModuleWithProviders,
  Type
} from '@angular/core';
import { SharedModule } from '../shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { HttpClientModule } from '@angular/common/http';

/**
 * Create async observable that emits-once and completes  after a JS engine turn
 * @param data any data
 * @returns Observable with completed promise
 */
export function asyncData<T>(data: T) {
  return defer(() => Promise.resolve(data));
}

/**
 * A class with a bunch of data for tests
 */
export class TestData {
  public static get instruments(): Instrument[] {
    return [
      {
        symbol: 'AAPL',
        exchange: 'SPBX',
        instrumentGroup: 'SPBX',
        isin: 'US0378331005',
        description: 'AAPL',
        shortName: 'AAPL',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DSKY',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JSQ90',
        description: 'DSKY',
        shortName: 'DSKY',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0009029540',
        description: 'SBER',
        shortName: 'SBER',
        currency: "RUB",
        minstep: 0.01
      },
      {
        symbol: 'DVEC',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU000A0JP2W1',
        description: 'DVEC',
        shortName: 'DVEC',
        currency: "RUB",
        minstep: 0.01
      }
    ];
  }
}

/**
 *  array of ng-zorro mock components
 */
export const ngZorroMockComponents = [
  mockComponent({selector: 'nz-header'}),
  mockComponent({
    selector: 'nz-table',
    inputs: [
      'nzFrontPagination',
      'nzNoResult',
      'nzShowPagination',
      'nzScroll',
      'nzData',
      'nzLoading',
      'nzWidthConfig',
      'nzVirtualMaxBufferPx',
      'nzVirtualMinBufferPx',
      'nzVirtualForTrackBy',
      'nzVirtualItemSize',
      'nzFooter'
    ]
  }),
  mockComponent({
    selector: 'nz-tabset',
    inputs: ['nzSelectedIndex', 'nzAnimated']
  }),
  mockComponent({ selector: 'nz-tab' }),
  mockComponent({ selector: 'nz-layout' }),
  mockComponent({ selector: 'nz-empty' }),
  mockComponent({ selector: 'nz-content' }),
  mockComponent({
    selector: 'nz-spin',
    inputs: ['nzSpinning', 'nzIndicator']
  }),
  mockComponent({
    selector: 'nz-form-control',
    inputs: ['nzErrorTip']
  }),
  mockComponent({selector: 'nz-collapse', inputs: ['nzBordered']}),
  mockComponent({ selector: 'nz-collapse-panel' }),
  mockComponent({ selector: 'nz-form-item' }),
  mockComponent({ selector: 'nz-form-label' }),
  mockComponent({ selector: 'nz-input-group' }),
  mockComponent({
    selector: 'nz-dropdown-menu',
    exportAs: 'nzDropdownMenu',
  }),
  mockComponent({
    selector: 'nz-avatar',
    inputs: ['nzSize', 'nzText', 'nzSrc']
  }),
  mockComponent({
    selector: 'nz-modal',
    inputs: ['nzCancelText', 'nzVisible']
  }),
  mockComponent({
    selector: 'nz-badge',
    inputs: ['nzColor', 'nzText', 'nzDropdownMenu', 'nzPopoverTitle', 'nzOffset', 'nzCount', 'nzPopoverVisible']
  }),
  mockComponent({ selector: 'nz-tag', inputs: ['nzColor', 'nz-tooltip', 'nzTooltipMouseEnterDelay']}),
  mockDirective({selector: '[text]', inputs: ['text']}),
  mockDirective({selector: '[nzLayout]', inputs: ['nzLayout']}),
  mockDirective({selector: '[nzPopoverContent]', inputs: ['nzPopoverContent']}),
  mockDirective({
    selector: '[nz-button]',
    inputs: ['nzDropdownMenu', 'title', 'text', 'nzLoading', 'nzType']
  }),
  mockDirective({
    selector: '[nz-icon]',
    inputs: ['title', 'text', 'nzTwotoneColor', 'nzTheme', 'nzType', 'nzRotate']
  }),
  mockDirective({
    selector: '[nz-tooltip]',
    inputs: ['nzTooltipTitle', 'nzTooltipTrigger', 'nzTooltipPlacement']
  })
];

/**
 *  SharedModule requires store module registered for root
 */
export const sharedModuleImportForTests: Array<Type<any> | ModuleWithProviders<{}> | any[]> = [
  StoreModule.forRoot({}),
  EffectsModule.forRoot(),
  SharedModule,
  HttpClientModule
];

/**
 *  function helper for mock components create
 */
export function mockComponent(options: Component, klass= (class {})) {
  let metadata: Component = { template: '<ng-content></ng-content>', ...options };
  const classWithOutputs = classWithOutputEmittersFactory(klass, options.outputs || []);

  return Component(metadata)(classWithOutputs);
}

export function mockDirective(options: Directive, klass = (class {})) {
  return Directive(options)(klass);
}

/**
 *  function for adding event emitters in mock component outputs
 */
function classWithOutputEmittersFactory(klass: any, outputs: string[]) {
  outputs.forEach(output => {
    klass[output] = new EventEmitter();
  });

  return klass;
}

/**
 * Create random string
 * @param length target string length
 * @returns random string
 */
export function generateRandomString(length: number): string {
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  let str = '';
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return str;
}

/**
 * Getting a random integer between two values
 * @param min minimum value
 * @param max maximum value
 * @returns the value is no lower than min (or the next integer greater than min if min isn't an integer), and is less than (but not equal to) max
 */
export function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}
