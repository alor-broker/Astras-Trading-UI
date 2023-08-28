import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ForwardSummaryComponent } from './forward-summary.component';
import { of } from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { getTranslocoModule } from "../../../../shared/utils/testing";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

describe('ForwardSummaryComponent', () => {
  let component: ForwardSummaryComponent;
  let fixture: ComponentFixture<ForwardSummaryComponent>;
  const spyPortfolioSummaryService = jasmine.createSpyObj('PortfolioSummaryService', ['getForwardRisks']);
  spyPortfolioSummaryService.getForwardRisks.and.returnValue(of(null));
  const settingsMock = {
    exchange: 'MOEX',
    portfolio: 'D39004',
    guid: '1230',
    ordersColumns: ['ticker'],
    tradesColumns: ['ticker'],
    positionsColumns: ['ticker'],
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ForwardSummaryComponent],
      imports: [
        getTranslocoModule()
      ],
      providers: [
        { provide: PortfolioSummaryService, useValue: spyPortfolioSummaryService },
        {
          provide: WidgetSettingsService,
          useValue: { getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock)) }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({
              portfoliosCurrency: []
            }))
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ForwardSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
