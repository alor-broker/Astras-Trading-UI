import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileDashboardWidgetComponent } from './mobile-dashboard-widget.component';
import { ACTIONS_CONTEXT } from "../../../../shared/services/actions-context";
import { StoreModule } from "@ngrx/store";
import { EffectsModule } from "@ngrx/effects";
import { MobileDashboardFeature } from "../../../../store/mobile-dashboard/mobile-dashboard.reducer";
import { ComponentHelpers } from 'src/app/shared/utils/testing/component-helpers';
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { NzLayoutComponent } from "ng-zorro-antd/layout";

describe('MobileDashboardWidgetComponent', () => {
  let component: MobileDashboardWidgetComponent;
  let fixture: ComponentFixture<MobileDashboardWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(MobileDashboardFeature),
        NzLayoutComponent
      ],
      declarations: [
        MobileDashboardWidgetComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-mobile-navbar' }),
        ComponentHelpers.mockComponent({ selector: 'ats-mobile-instruments-history' }),
        ComponentHelpers.mockComponent({ selector: 'ats-mobile-dashboard' }),
        ComponentHelpers.mockComponent({ selector: 'ats-help-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-terminal-settings-widget', inputs:['hiddenSections'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-news-modal-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-feedback-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-application-updated-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-edit-order-dialog-widget' }),
        ComponentHelpers.mockComponent({ selector: 'ats-empty-portfolios-warning-modal-widget' })

      ],
      providers: [
        {
          provide: ACTIONS_CONTEXT,
          useValue: {
            instrumentSelected: jasmine.createSpy('instrumentSelected').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileDashboardWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
