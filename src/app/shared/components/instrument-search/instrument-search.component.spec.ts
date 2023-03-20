import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSearchComponent } from './instrument-search.component';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import { of } from 'rxjs';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from '../../utils/testing';
import ruInstrumentSearch from "../../../../assets/i18n/shared/instrument-search/ru.json";

describe('InstrumentSearchComponent', () => {
  let component: InstrumentSearchComponent;
  let fixture: ComponentFixture<InstrumentSearchComponent>;

  let instrumentsServiceSpy: any;

  beforeEach(() => {
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
    instrumentsServiceSpy.getInstruments.and.returnValue(of([]));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'shared/instrument-search/ru': ruInstrumentSearch,
          }
        }),
      ],
      declarations: [InstrumentSearchComponent],
      providers: [
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        },
        ...commonTestProviders
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InstrumentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
