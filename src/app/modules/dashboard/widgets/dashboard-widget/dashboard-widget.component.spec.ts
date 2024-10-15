import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { OnboardingService } from '../../services/onboarding.service';

import { DashboardWidgetComponent } from './dashboard-widget.component';
import { StoreModule } from "@ngrx/store";
import { DashboardsFeature } from "../../../../store/dashboards/dashboards.reducer";
import { EffectsModule } from "@ngrx/effects";
import { DesktopSettingsBrokerService } from "../../services/desktop-settings-broker.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { NzLayoutModule } from "ng-zorro-antd/layout";

describe('DashboardWidgetComponent', () => {
  let component: DashboardWidgetComponent;
  let fixture: ComponentFixture<DashboardWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const spyOnboarding = jasmine.createSpyObj('OnboardingService', ['start']);
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(DashboardsFeature),
        NzLayoutModule
      ],
      declarations: [
        DashboardWidgetComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-dashboard' }),
        ComponentHelpers.mockComponent({ selector: 'ats-navbar' }),
        ComponentHelpers.mockComponent({ selector: 'ats-orders-dialog-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-edit-order-dialog-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-help-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-terminal-settings-widget', inputs:['hiddenSections'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-news-modal-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-feedback-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-application-updated-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-empty-portfolios-warning-modal-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-settings-load-error-dialog', inputs:['visible'] })
      ],
      providers: [
        {
          provide: OnboardingService,
          useValue: spyOnboarding
        },
        {
          provide: DesktopSettingsBrokerService,
          useValue: {
            initSettingsBrokers: jasmine.createSpy('initSettingsBrokers').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
