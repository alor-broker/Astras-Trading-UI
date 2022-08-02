import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandHeaderComponent } from './command-header.component';
import { CommandsService } from "../../services/commands.service";
import { Store } from "@ngrx/store";

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const quoteSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    const historySpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    const positionSpy = jasmine.createSpyObj('PositionsService', ['getByPortfolio']);
    const commandsServiceSpy = jasmine.createSpyObj('CommandsService', ['setPriceSelected']);

    historySpy.getDaysOpen.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [CommandHeaderComponent],
      providers: [
        { provide: QuotesService, useValue: quoteSpy },
        { provide: HistoryService, useValue: historySpy },
        { provide: PositionsService, useValue: positionSpy },
        { provide: CommandsService, useValue: commandsServiceSpy },
        {
          provide: Store,
          useValue: {
            select: jasmine.createSpy('select').and.returnValue(of({}))
          }
        }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
