import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { OnboardingService } from '../../services/onboarding.service';

import { DashboardWidgetComponent } from './dashboard-widget.component';
import {
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('DashboardWidgetComponent', () => {
  let component: DashboardWidgetComponent;
  let fixture: ComponentFixture<DashboardWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const spyOnboarding = jasmine.createSpyObj('OnboardingService', ['start']);
    await TestBed.configureTestingModule({
      declarations: [
        DashboardWidgetComponent,
        ...ngZorroMockComponents,
        mockComponent({ selector: 'ats-dashboard' }),
        mockComponent({ selector: 'ats-navbar' }),
        mockComponent({ selector: 'ats-command-widget' }),
        mockComponent({ selector: 'ats-edit-widget' }),
        mockComponent({ selector: 'ats-help-widget' }),
        mockComponent({ selector: 'ats-terminal-settings-widget' }),
        mockComponent({ selector: 'ats-news-modal-widget' }),
        mockComponent({ selector: 'ats-feedback-widget' }),
        mockComponent({ selector: 'ats-application-updated-widget' })
      ],
      providers: [
        { provide: OnboardingService, useValue: spyOnboarding }
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
