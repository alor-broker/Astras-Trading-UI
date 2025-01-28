import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MobileHomeScreenWidgetComponent} from './mobile-home-screen-widget.component';
import {MockComponents, MockModule, MockProvider} from "ng-mocks";
import {
  MobileHomeScreenContentComponent
} from "../../components/mobile-home-screen-content/mobile-home-screen-content.component";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {EMPTY} from 'rxjs';
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {UserPortfoliosService} from "../../../../shared/services/user-portfolios.service";
import {SharedModule} from "../../../../shared/shared.module";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {WidgetMeta} from "../../../../shared/models/widget-meta.model";

describe('MobileHomeScreenWidgetComponent', () => {
  let component: MobileHomeScreenWidgetComponent;
  let fixture: ComponentFixture<MobileHomeScreenWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MobileHomeScreenWidgetComponent,
        MockComponents(
          MobileHomeScreenContentComponent
        ),
        MockModule(SharedModule)
      ],
      providers: [
        MockProvider(
          WidgetSettingsService,
          {
            getSettings: () => EMPTY,
            getSettingsOrNull: () => EMPTY
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          UserPortfoliosService,
          {
            getPortfolios: () => EMPTY
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(MobileHomeScreenWidgetComponent);
    component = fixture.componentInstance;
    component.widgetInstance = {
      instance: {
        guid: 'guid'
      } as Widget,
      widgetMeta: {widgetName: {}} as WidgetMeta
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
