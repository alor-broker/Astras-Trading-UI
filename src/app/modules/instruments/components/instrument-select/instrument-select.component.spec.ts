import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { InstrumentSelectComponent } from './instrument-select.component';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments', 'unsubscribe']);
  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['add', 'unsubscribe']);
  spyWatcher.add.and.returnValue();

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstrumentSelectComponent ],
      providers: [
        provideMockStore(),
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
    });
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
