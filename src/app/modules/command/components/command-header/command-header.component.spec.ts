import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { SyncState } from 'src/app/shared/ngrx/reducers/sync.reducer';
import { HistoryService } from 'src/app/shared/services/history.service';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { provideMockStore } from '@ngrx/store/testing';
import { CommandHeaderComponent } from './command-header.component';

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;
  const initialState: SyncState = {
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
    const quoteSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    const historySpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    const positionSpy = jasmine.createSpyObj('PositionsService', ['getByPortfolio']);

    historySpy.getDaysOpen.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [CommandHeaderComponent],
      providers: [
        { provide: QuotesService, useValue: quoteSpy },
        { provide: HistoryService, useValue: historySpy },
        { provide: PositionsService, useValue: positionSpy },
        provideMockStore({ initialState }),
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
