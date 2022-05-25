import { TestBed } from '@angular/core/testing';
import { JoyrideService } from 'ngx-joyride';
import { OnboardingService } from './onboarding.service';

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    let spy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: JoyrideService, useValue: spy }
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
