import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfolioSummaryComponent} from './portfolio-summary.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('PortfolioSummaryComponent', () => {
  let component: PortfolioSummaryComponent;
  let fixture: ComponentFixture<PortfolioSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        PortfolioSummaryComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-scrollable-row'
        }),
        ComponentHelpers.mockDirective({
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
