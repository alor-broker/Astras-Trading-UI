import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfolioSummaryComponent} from './portfolio-summary.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {getTranslocoModule, mockComponent, mockDirective} from "../../../../shared/utils/testing";

describe('PortfolioSummaryComponent', () => {
  let component: PortfolioSummaryComponent;
  let fixture: ComponentFixture<PortfolioSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        PortfolioSummaryComponent,
        mockComponent({
          selector: 'ats-scrollable-row'
        }),
        mockDirective({
          selector: '[atsScrollableItem]'
        })
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: PortfolioSummaryService,
          useValue: {
            getCommonSummary: jasmine.createSpy('getCommonSummary').and.returnValue(new Subject()),
            getForwardRisks: jasmine.createSpy('getForwardRisks').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PortfolioSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
