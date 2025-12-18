import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { Widget } from "../../../../shared/models/dashboard/widget.model";
import { WidgetMeta } from "../../../../shared/models/widget-meta.model";
import { PortfolioChartsWidgetComponent } from "./portfolio-charts-widget.component";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {
  MockComponents,
  MockProvider
} from "ng-mocks";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { EMPTY } from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { UserPortfoliosService } from "../../../../shared/services/user-portfolios.service";
import { AgreementDynamicsComponent } from "../../components/agreement-dynamics/agreement-dynamics.component";
import {WidgetSkeletonComponent} from "../../../../shared/components/widget-skeleton/widget-skeleton.component";
import {WidgetHeaderComponent} from "../../../../shared/components/widget-header/widget-header.component";

describe('PortfolioChartsWidgetComponent', () => {
  let component: PortfolioChartsWidgetComponent;
  let fixture: ComponentFixture<PortfolioChartsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        PortfolioChartsWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          AgreementDynamicsComponent,
          WidgetSkeletonComponent,
          WidgetHeaderComponent
        )
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY,
            getSettingsOrNull: () => EMPTY,
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY,
          }
        ),
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY,
          }
        ),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PortfolioChartsWidgetComponent);
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
