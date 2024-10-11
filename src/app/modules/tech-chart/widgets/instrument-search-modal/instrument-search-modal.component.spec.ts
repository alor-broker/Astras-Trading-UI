import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { InstrumentSearchModalComponent } from './instrument-search-modal.component';
import { InstrumentSearchService } from "../../services/instrument-search.service";
import { BehaviorSubject, of } from "rxjs";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzModalModule } from "ng-zorro-antd/modal";

describe('InstrumentSearchModalComponent', () => {
  let component: InstrumentSearchModalComponent;
  let fixture: ComponentFixture<InstrumentSearchModalComponent>;

  const minusSign = '－';
  const modalOpened$ = new BehaviorSubject(false);
  const modalParams$ = new BehaviorSubject('123');

  let instrumentsServiceSpy: any;
  let instrumentSearchServiceSpy: any;

  beforeEach(async () => {
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
    instrumentSearchServiceSpy = jasmine.createSpyObj(
      'InstrumentSearchService',
      ['closeModal'],
      { isModalOpened$: modalOpened$, modalParams$: modalParams$ }
    );

    await TestBed.configureTestingModule({
      declarations: [
        InstrumentSearchModalComponent,
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getTestingModules(),
        NzModalModule
      ],
      providers: [
        {
          provide: InstrumentSearchService,
          useValue: instrumentSearchServiceSpy
        },
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InstrumentSearchModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should correctly validate search field', () => {
    const validValues = [
      'SBER',
      'si-9.24',
      'si-6.24-9.24',
      'MOEX:SBER',
      'MOEX:si-9.24',
      'MOEX:si-6.24-9.24',
      'MOEX:SBER:TQBR',
      'MOEX:si-9.24:TQBR',
      'MOEX:si-6.24-9.24:TQBR',
      '[MOEX:SBER:TQBR]',
      '[MOEX:CNY-9.24:TQBR]',
      '[MOEX:NG-7.24-8.24:TQBR]',
      `[MOEX:SI-9.24:TQBR]${minusSign}[MOEX:SI-6.24:TQBR]`,
      `[MOEX:SBER:TQBR]${minusSign}[MOEX:SBERP:TQBR]`
    ];

    const invalidValues = [
      null,
      '',
      `[MOEX:SBER]${minusSign}`,
      '[MOEX:SBER][MOEX:SBERP]'
    ];

    validValues.forEach(v => {
      component.searchControl.setValue(v);
      expect(component.searchControl.valid).toBeTrue();
    });

    invalidValues.forEach(v => {
      component.searchControl.setValue(v);
      expect(component.searchControl.invalid).toBeTrue();
    });
  });

  it('should correctly pass filters for search', fakeAsync(() => {
    component.searchInput = { nativeElement: document.createElement('input') };
    component.searchInput.nativeElement.addEventListener('keyup', () => component.filterChanged());

    instrumentsServiceSpy.getInstruments.and.returnValue(of([]));

    const baseFilter = { limit: 20 };

    const testCases = [
      {
        inputValue: 'SBER',
        caretPos: 4,
        expected: { query: 'SBER' }
      },
      {
        inputValue: '[MOEX:SBER]',
        caretPos: 10,
        expected: { query: 'SBER', exchange: 'MOEX', instrumentGroup: '' }
      },
      {
        inputValue: '[MOEX:SBER:TQBR]',
        caretPos: 15,
        expected: { query: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR' }
      },
      {
        inputValue: `[MOEX:SBER:TQBR]${minusSign}`,
        caretPos: 17,
        expected: { query: '' }
      },
      {
        inputValue: `[MOEX:SBER:TQBR]${minusSign}astr`,
        caretPos: 21,
        expected: { query: 'astr' }
      },
      {
        inputValue: `[MOEX:SBER:TQBR]${minusSign}[MOEX:ASTR]`,
        caretPos: 9,
        expected: { query: 'SBE', exchange: 'MOEX', instrumentGroup: '' }
      },
      {
        inputValue: `si-6.24-9.`,
        caretPos: 10,
        expected: { query: 'si-6.24-9.' }
      },
      {
        inputValue: `[MOEX:si-9.24]${minusSign}si-6.24`,
        caretPos: 22,
        expected: { query: 'si-6.24' }
      },
      {
        inputValue: `[MOEX:si-9.24]${minusSign}[MOEX:si-6.24]`,
        caretPos: 28,
        expected: { query: 'si-6.24', exchange: 'MOEX', instrumentGroup: '' }
      }
    ];

    const event = new KeyboardEvent('keyup');

    const instrumentsSub = component.filteredInstruments$.subscribe();

    testCases.forEach(testCase => {
      component.searchControl.setValue(testCase.inputValue);
      component.searchInput.nativeElement.value = testCase.inputValue;
      component.searchInput.nativeElement.selectionStart = testCase.caretPos;
      component.searchInput.nativeElement.dispatchEvent(event);
      fixture.detectChanges();

      tick(200);

      expect(instrumentsServiceSpy.getInstruments).toHaveBeenCalledWith({ ...baseFilter, ...testCase.expected });
    });

    instrumentsSub.unsubscribe();
  }));
});
