import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { OnboardingService } from '../../services/onboarding.service';

import { DashboardWidgetComponent } from './dashboard-widget.component';
import {
  commonTestProviders,
  mockComponent,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";

describe('DashboardWidgetComponent', () => {
  let component: DashboardWidgetComponent;
  let fixture: ComponentFixture<DashboardWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const spyOnboarding = jasmine.createSpyObj('OnboardingService', ['start']);
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [
        DashboardWidgetComponent,
        mockComponent({ selector: 'ats-dashboard' }),
        mockComponent({ selector: 'ats-navbar' }),
        mockComponent({ selector: 'ats-orders-dialog-widget' }),
        mockComponent({ selector: 'ats-edit-order-dialog-widget' }),
        mockComponent({ selector: 'ats-help-widget' }),
        mockComponent({ selector: 'ats-terminal-settings-widget', inputs:['hiddenSections'] }),
        mockComponent({ selector: 'ats-news-modal-widget' }),
        mockComponent({ selector: 'ats-feedback-widget' }),
        mockComponent({ selector: 'ats-application-updated-widget' })
      ],
      providers: [
        { provide: OnboardingService, useValue: spyOnboarding },
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
