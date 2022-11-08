import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { InstrumentSearchComponent } from './instrument-search.component';
import { InstrumentsService } from '../../../modules/instruments/services/instruments.service';
import { of } from 'rxjs';

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
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
