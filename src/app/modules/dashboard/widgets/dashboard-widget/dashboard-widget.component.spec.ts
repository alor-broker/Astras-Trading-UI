import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OnboardingService } from '../../services/onboarding.service';

import { DashboardWidgetComponent } from './dashboard-widget.component';
import { ModalService } from '../../../../shared/services/modal.service';

describe('DashboardWidgetComponent', () => {
  let component: DashboardWidgetComponent;
  let fixture: ComponentFixture<DashboardWidgetComponent>;
  const modalServiceSpy = jasmine.createSpyObj('ModalService', ['openBetaReminderModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    const spyAuth = jasmine.createSpyObj('AuthService', ['refresh']);
    const spyOnboarding = jasmine.createSpyObj('OnboardingService', ['start']);
    spyAuth.refresh.and.returnValue(of(''));
    await TestBed.configureTestingModule({
      declarations: [DashboardWidgetComponent],
      providers: [
        { provide: AuthService, useValue: spyAuth },
        { provide: OnboardingService, useValue: spyOnboarding },
        { provide: ModalService, useValue: modalServiceSpy }
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
