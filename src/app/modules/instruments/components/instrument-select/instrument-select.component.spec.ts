import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { SyncState } from 'src/app/shared/ngrx/reducers/sync.reducer';
import { InstrumentsService } from '../../services/instruments.service';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { InstrumentSelectComponent } from './instrument-select.component';

describe('InstrumentSelectComponent', () => {
  let component: InstrumentSelectComponent;
  let fixture: ComponentFixture<InstrumentSelectComponent>;
  const spyInstrs = jasmine.createSpyObj('InstrumentsService', ['getInstruments', 'unsubscribe'])
  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['add', 'unsubscribe'])
  spyWatcher.add.and.returnValue();
  const initialState : SyncState = {
    instrument: {
      symbol: 'SBER',
      exchange: Exchanges.MOEX,
      instrumentGroup: 'TQBR',
      isin: 'RU0009029540'
    },
    portfolio: {
      portfolio: "D39004",
      exchange: Exchanges.MOEX
    }
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InstrumentSelectComponent ],
      providers: [
        provideMockStore({ initialState }),
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
