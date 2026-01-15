import {ComponentFixture, TestBed} from '@angular/core/testing';

import {InstrumentSearchModalComponent} from './instrument-search-modal.component';
import {InstrumentSearchService} from "../../services/instrument-search.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {NzModalFooterDirective} from "ng-zorro-antd/modal";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzInputGroupWhitSuffixOrPrefixDirective} from "ng-zorro-antd/input";
import {
  NzAutocompleteComponent,
  NzAutocompleteOptionComponent,
  NzAutocompleteTriggerDirective
} from "ng-zorro-antd/auto-complete";
import {NzTagComponent} from "ng-zorro-antd/tag";
import {LoadingIndicatorComponent} from "../../../../shared/components/loading-indicator/loading-indicator.component";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {BehaviorSubject} from "rxjs";

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
      {isModalOpened$: modalOpened$, modalParams$: modalParams$}
    );

    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        InstrumentSearchModalComponent,
        MockComponents(
          NzAutocompleteComponent,
          NzAutocompleteOptionComponent,
          NzTagComponent,
          LoadingIndicatorComponent,
          NzButtonComponent,
        ),
        MockDirectives(
          NzAutocompleteTriggerDirective,
          NzModalFooterDirective,
          NzInputGroupWhitSuffixOrPrefixDirective
        )
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
});
