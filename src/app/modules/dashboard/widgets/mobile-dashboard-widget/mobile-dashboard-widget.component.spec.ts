import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MobileDashboardWidgetComponent } from './mobile-dashboard-widget.component';
import { OnboardingService } from "../../services/onboarding.service";
import {
  commonTestProviders,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";

describe('MobileDashboardWidgetComponent', () => {
  let component: MobileDashboardWidgetComponent;
  let fixture: ComponentFixture<MobileDashboardWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [
        MobileDashboardWidgetComponent,
        mockComponent({ selector: 'ats-mobile-navbar' }),
        mockComponent({ selector: 'ats-mobile-instruments-history' }),
        mockComponent({ selector: 'ats-mobile-dashboard' }),
        mockComponent({ selector: 'ats-help-widget' }),
        mockComponent({ selector: 'ats-terminal-settings-widget', inputs:['hiddenSections'] }),
        mockComponent({ selector: 'ats-news-modal-widget' }),
        mockComponent({ selector: 'ats-feedback-widget' }),
        mockComponent({ selector: 'ats-application-updated-widget' }),
        mockComponent({ selector: 'ats-edit-order-dialog-widget' }),
      ],
      providers: [
        { provide: OnboardingService, useValue: { start: jasmine.createSpy('start').and.callThrough() } },
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
