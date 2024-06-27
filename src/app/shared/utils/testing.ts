import { defer, Observable } from 'rxjs';
import { Instrument } from '../models/instruments/instrument.model';
import {
  Component,
  Directive,
  EventEmitter,
  forwardRef,
  Input,
  ModuleWithProviders,
  Type
} from '@angular/core';
import { SharedModule } from '../shared.module';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { HttpClientModule } from '@angular/common/http';
import { TranslocoTestingModule, TranslocoTestingOptions } from "@ngneat/transloco";
import ru from '../../../assets/i18n/ru.json';
import { ErrorHandlerService } from '../services/handle-error/error-handler.service';
import { LOGGER } from '../services/logging/logger-base';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from "@angular/forms";

/**
 * Create async observable that emits-once and completes  after a JS engine turn
 * @param data any data
 * @returns Observable with completed promise
 */
export function asyncData<T>(data: T): Observable<T> {
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
 *  function for adding event emitters in mock component outputs
 */
function classWithOutputEmittersFactory(klass: any, outputs: string[]): { prototype: any, new: () => any} {
  outputs.forEach(output => {
    klass[output] = new EventEmitter();
  });

  return klass as { prototype: any, new: () => any};
}

/**
 *  function helper for mock components create
 */
export function mockComponent(options: Component, klass = (class {
})): unknown {
  let metadata: Component = {template: '<ng-content></ng-content>', ...options};
  const classWithOutputs = classWithOutputEmittersFactory(klass, options.outputs ?? []);

  return Component(metadata)(classWithOutputs);
}

export function mockDirective(options: Directive, klass = (class {
})): any {
  return Directive(options)(klass);
}

/**
 *  array of ng-zorro mock components
 */
export const ngZorroMockComponents = [
  mockComponent({selector: 'nz-header', inputs: [ 'stepContent' ]}),
  mockComponent({
    selector: 'nz-table',
    inputs: [
      'nzFrontPagination',
      'nzNoResult',
      'nzShowPagination',
      'nzPaginationType',
      'nzPageSize',
      'nzScroll',
      'nzData',
      'nzLoading',
      'nzWidthConfig',
      'nzVirtualMaxBufferPx',
      'nzVirtualMinBufferPx',
      'nzVirtualForTrackBy',
      'nzVirtualItemSize',
      'nzFooter',
      'atsTableRowHeight'
    ]
  }),
  mockComponent({
    selector: 'nz-drawer',
    inputs: [
      'nzClosable',
      'nzVisible',
      'nzPlacement',
      'nzWrapClassName',
      'nzTitle',
      'nzSize',
      'nzContent',
      'nzExtra'
    ]
  }),
  mockComponent({
    selector: 'nz-tabset',
    inputs: ['nzSelectedIndex', 'nzAnimated']
  }),
  mockComponent({selector: 'nz-tab', inputs: ['nzTitle']}),
  mockComponent({selector: 'nz-layout'}),
  mockComponent({selector: 'nz-empty'}),
  mockComponent({selector: 'nz-content'}),
  mockComponent({
    selector: 'nz-spin',
    inputs: ['nzSpinning', 'nzIndicator', 'nzTip']
  }),
  mockComponent({
    selector: 'nz-form-control',
    inputs: ['nzErrorTip', 'nzValidateStatus']
  }),
  mockComponent({selector: 'nz-collapse', inputs: ['nzBordered']}),
  mockComponent({selector: 'nz-collapse-panel', inputs: ['nzHeader']}),
  mockComponent({selector: 'nz-form-item'}),
  mockComponent({selector: 'nz-form-label', inputs: ['nzFor']}),
  mockComponent({selector: 'nz-input-group'}),
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
    inputs: ['nzCancelText', 'nzVisible', 'nzTitle', 'nzMaskClosable', 'nzOkText']
  }),
  mockComponent({
    selector: 'nz-badge',
    inputs: ['nzColor', 'nzText', 'nzDropdownMenu', 'nzPopoverTitle', 'nzOffset', 'nzCount', 'nzPopoverVisible']
  }),
  mockComponent({
    selector: 'nz-calendar',
    inputs: ['nzDateFullCell', 'nzFullscreen', 'nzDisabledDate']
  }, class NzCalendarComponent {
    onMonthSelect(): void {
      return;
    }
  }),
  mockComponent({selector: 'nz-tag', inputs: ['nzColor', 'nz-tooltip', 'nzTooltipMouseEnterDelay']}),
  mockComponent({selector: 'nz-select', inputs: ['ngModel', 'nzMaxTagCount']}),
  mockComponent({selector: 'nz-option', inputs: ['nzValue', 'nzLabel']}),
  mockComponent({selector: 'nz-divider'}),
  mockComponent({selector: 'nz-tree', inputs: ['nzData', 'nzTreeTemplate']}),
  mockComponent({selector: 'nz-switch'}),
  mockComponent({selector: 'nz-segmented', inputs: ['nzLabelTemplate', 'nzOptions', 'ngModel']}),
  mockComponent({selector: 'nz-button-group'}),
  mockComponent({selector: 'nz-alert', inputs: ['nzType', 'nzDescription', 'nzCloseable']}),
  mockDirective({selector: '[nzGutter]', inputs: ['nzGutter']}),
  mockDirective({selector: '[text]', inputs: ['text']}),
  mockDirective({selector: '[nzLayout]', inputs: ['nzLayout']}),
  mockDirective({selector: '[nzPopoverContent]', inputs: ['nzPopoverContent']}),
  mockDirective({selector: '[nzPopoverTitle]', inputs: ['nzPopoverTitle']}),
  mockDirective({
    selector: '[nz-button]',
    inputs: ['nzDropdownMenu', 'title', 'text', 'nzLoading', 'nzType', 'nzClickHide', 'nzVisible', 'disabled']
  }),
  mockDirective({
    selector: '[nz-icon]',
    inputs: ['title', 'text', 'nzTwotoneColor', 'nzTheme', 'nzType', 'nzRotate']
  }),
  mockDirective({
    selector: '[nz-tooltip]',
    inputs: ['nz-tooltip', 'nzTooltipTitle', 'nzTooltipTrigger', 'nzTooltipPlacement', 'nzTooltipMouseEnterDelay']
  }),
  mockDirective({
    selector: 'th',
    inputs: ['nzWidth', 'nzCustomFilter', 'nzSortFn', 'nzFilters', 'nzShowFilter', 'minWidth', 'nzFilterMultiple']
  }),
  mockDirective({
    selector: '[nz-typography]',
    inputs: ['nzType']
  })
];


/**
 *  ats-widget-skeleton mock
 */
export const widgetSkeletonMock = mockComponent({
  selector: 'ats-widget-skeleton',
  inputs: ['content', 'header', 'settings', 'showContentScroll', 'showSettings', 'isBlockWidget']
});

/**
 *  SharedModule requires store module registered for root
 */
export const sharedModuleImportForTests: (Type<any> | ModuleWithProviders<object> | any[])[] = [
  StoreModule.forRoot({}),
  EffectsModule.forRoot(),
  SharedModule,
  HttpClientModule
];

/**
 *  Providers for tests
 */
export const commonTestProviders: any[] = [
  {
    provide: ErrorHandlerService,
    useValue: {
      handleError: jasmine.createSpy('handleError').and.callThrough()
    }
  },
  {
    provide: LOGGER,
    useValue: []
  }
];

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
export function getRandomInt(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

/**
 * Getting a transloco testing module
 * @param options transoloco options
 * @returns the value is no lower than min (or the next integer greater than min if min isn't an integer), and is less than (but not equal to) max
 */
export function getTranslocoModule(options: TranslocoTestingOptions = {}): ModuleWithProviders<TranslocoTestingModule> {
  const {langs} = options;

  return TranslocoTestingModule.forRoot({
    langs: {ru, ...langs},
    translocoConfig: {
      availableLangs: ['ru'],
      defaultLang: 'ru',
    },
    preloadLangs: true,
  });
}

@Component({
  selector: 'ats-instrument-search',
  template: '',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InstrumentSearchMockComponent),
    multi: true
  }]
})
export class InstrumentSearchMockComponent implements ControlValueAccessor {
  @Input() instrument: any;
  @Input() placeholder: any;

  registerOnChange(): void {
    return;
  }

  registerOnTouched(): void {
    return;
  }

  setDisabledState(): void {
    return;
  }

  writeValue(): void {
    return;
  }
}
