import {ComponentFixture, TestBed} from '@angular/core/testing';
import {of} from 'rxjs';

import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {CommonSummaryComponent} from './common-summary.component';
import {PortfolioSummaryService} from "../../../../shared/services/portfolio-summary.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from "ng-zorro-antd/descriptions";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('CommonSummaryComponent', () => {
  let component: CommonSummaryComponent;
  let fixture: ComponentFixture<CommonSummaryComponent>;
  const spyPortfolioSummaryService = jasmine.createSpyObj('PortfolioSummaryService', ['getCommonSummary']);
  spyPortfolioSummaryService.getCommonSummary.and.returnValue(of(null));

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
      imports: [
        TranslocoTestsModule.getModule(),
        CommonSummaryComponent,
        MockComponents(
          NzDescriptionsComponent,
          NzDescriptionsItemComponent,
        ),
        MockDirectives(
          NzResizeObserverDirective,
        )
      ],
      providers: [
        {provide: PortfolioSummaryService, useValue: spyPortfolioSummaryService},
        {
          provide: WidgetSettingsService,
          useValue: {getSettings: jasmine.createSpy('getSettings').and.returnValue(of(settingsMock))}
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
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommonSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
