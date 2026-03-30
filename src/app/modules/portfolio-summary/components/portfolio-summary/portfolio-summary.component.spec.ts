import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfolioSummaryComponent} from './portfolio-summary.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {ScrollableRowComponent} from "../../../../shared/components/scrollable-row/scrollable-row.component";
import {ScrollableItemDirective} from "../../../../shared/directives/scrollable-item.directive";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('PortfolioSummaryComponent', () => {
  let component: PortfolioSummaryComponent;
  let fixture: ComponentFixture<PortfolioSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        PortfolioSummaryComponent,
        MockComponents(
          ScrollableRowComponent,
        ),
        MockDirectives(
          ScrollableItemDirective,
        )
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
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
