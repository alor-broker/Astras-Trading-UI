import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';

import { InstrumentSelectComponent } from './instrument-select.component';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spySync = jasmine.createSpyObj('SyncService', ['selectedInstrument$'])
  spySync.selectedInstrument$ = of(null);
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments', 'unsubscribe'])

  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['add', 'unsubscribe'])
  spyWatcher.add.and.returnValue();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstrumentSelectComponent ],
      providers: [
        { provide: SyncService, useValue: spySync },
        { provide: InstrumentsService, useValue: spyInstrs },
      ]
    })
    .compileComponents();
    TestBed.overrideComponent(InstrumentSelectComponent, {
      set: {
        providers: [
          { provide: WatchInstrumentsService, useValue: spyWatcher },
        ]
      }
    })
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
