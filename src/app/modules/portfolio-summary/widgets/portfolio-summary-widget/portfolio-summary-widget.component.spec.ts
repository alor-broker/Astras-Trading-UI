import {ComponentFixture, TestBed} from '@angular/core/testing';

import {PortfolioSummaryWidgetComponent} from './portfolio-summary-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {PortfolioSummaryComponent} from "../../components/portfolio-summary/portfolio-summary.component";

describe('PortfolioSummaryWidgetComponent', () => {
  let component: PortfolioSummaryWidgetComponent;
  let fixture: ComponentFixture<PortfolioSummaryWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioSummaryWidgetComponent,
        MockComponents(
          NzButtonComponent,
          PortfolioSummaryComponent,
        ),
        MockDirectives(
          NzIconDirective
        )
      ],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject()),
            getSettingsOrNull: jasmine.createSpy('getSettingsOrNull').and.returnValue(new Subject()),
            addSettings: jasmine.createSpy('getSettingsOrNull').and.callThrough(),
          }
        },
        {
          provide: ManageDashboardsService,
          useValue: {
            removeWidget: jasmine.createSpy('removeWidget').and.callThrough()
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: new Subject(),
            selectedDashboard$: new Subject(),
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PortfolioSummaryWidgetComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'widgetInstance',
      {
        instance: {
          guid: 'guid'
        } as Widget,
        widgetMeta: {widgetName: {}} as WidgetMeta
      }
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
