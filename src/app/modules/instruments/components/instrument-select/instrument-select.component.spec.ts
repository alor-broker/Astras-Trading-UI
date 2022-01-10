import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { InstrumentsService } from '../../services/instruments.service';

import { InstrumentSelectComponent } from './instrument-select.component';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spySync = jasmine.createSpyObj('SyncService', ['selectedInstrument$'])
  spySync.selectedInstrument$ = of(null);
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments'])

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstrumentSelectComponent ],
      providers: [
        { provide: SyncService, useValue: spySync },
        { provide: InstrumentsService, useValue: spyInstrs }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InstrumentSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
