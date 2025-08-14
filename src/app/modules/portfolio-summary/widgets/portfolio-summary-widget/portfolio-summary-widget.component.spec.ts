import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioSummaryWidgetComponent } from './portfolio-summary-widget.component';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Subject} from "rxjs";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('PortfolioSummaryWidgetComponent', () => {
  let component: PortfolioSummaryWidgetComponent;
  let fixture: ComponentFixture<PortfolioSummaryWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        PortfolioSummaryWidgetComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-portfolio-summary',
          inputs: ['guid']
        })
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
    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {} as WidgetMeta
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
