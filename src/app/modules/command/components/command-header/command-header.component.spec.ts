import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HistoryService } from 'src/app/shared/services/history.service';
import { PositionsService } from 'src/app/shared/services/positions.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandHeaderComponent } from './command-header.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';

describe('CommandHeaderComponent', () => {
  let component: CommandHeaderComponent;
  let fixture: ComponentFixture<CommandHeaderComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const quoteSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
    const historySpy = jasmine.createSpyObj('HistoryService', ['getDaysOpen']);
    const positionSpy = jasmine.createSpyObj('PositionsService', ['getByPortfolio']);

    historySpy.getDaysOpen.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [CommandHeaderComponent],
      providers: [
        { provide: QuotesService, useValue: quoteSpy },
        { provide: HistoryService, useValue: historySpy },
        { provide: PositionsService, useValue: positionSpy }
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
