import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';

import { CommandHeaderComponent } from './command-header.component';

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;

  beforeEach(async () => {
    const quoteSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    const historySpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    const positionSpy = jasmine.createSpyObj('PositionsService', ['getByPortfolio']);
    const syncSpy = jasmine.createSpyObj('SyncService', ['selectedPortfolio$']);
    syncSpy.selectedPortfolio$ = of(null)
    historySpy.getDaysOpen.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [ CommandHeaderComponent ],
      providers: [
        { provide: QuotesService, useValue: quoteSpy },
        { provide: HistoryService, useValue: historySpy },
        { provide: PositionsService, useValue: positionSpy },
        { provide: SyncService, useValue: syncSpy },
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
