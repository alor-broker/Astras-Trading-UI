import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { SyncState } from 'src/app/shared/ngrx/reducers/sync.reducer';
import { WatchInstrumentsService } from '../../services/watch-instruments.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { WatchlistTableComponent } from './watchlist-table.component';

describe('WatchlistTableComponent', () => {
  let component: WatchlistTableComponent;
  let fixture: ComponentFixture<WatchlistTableComponent>;

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

  const spySync = jasmine.createSpyObj('SyncService', ['selectNewInstrument'])
  spySync.selectedInstrument$ = of(null);

  const spyWatcher = jasmine.createSpyObj('WatchInstrumentsService', ['getWatched'])
  spyWatcher.getWatched.and.returnValue(of([]));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WatchlistTableComponent ],
      providers: [
        provideMockStore({ initialState }),
        { provide: WatchInstrumentsService, useValue: spyWatcher },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WatchlistTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
