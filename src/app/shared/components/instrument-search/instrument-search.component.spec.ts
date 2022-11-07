import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSearchComponent } from './instrument-search.component';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import { of } from 'rxjs';
import { sharedModuleImportForTests } from '../../utils/testing';
import { Store } from '@ngrx/store';

describe('InstrumentSearchComponent', () => {
  let component: InstrumentSearchComponent;
  let fixture: ComponentFixture<InstrumentSearchComponent>;

  let store: Store;

  let instrumentsServiceSpy: any;

  beforeEach(() => {
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstruments']);
    instrumentsServiceSpy.getInstruments.and.returnValue(of([]));
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      declarations: [InstrumentSearchComponent],
      providers: [
        {
          provide: InstrumentsService,
          useValue: instrumentsServiceSpy
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(InstrumentSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    store = TestBed.inject(Store);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
