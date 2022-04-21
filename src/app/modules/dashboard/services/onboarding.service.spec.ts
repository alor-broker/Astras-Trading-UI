/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { JoyrideService } from 'ngx-joyride';
import { OnboardingService } from './onboarding.service';

describe('Service: Onboarding', () => {
  beforeEach(() => {
    let spy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: JoyrideService, useValue: spy }
      ]
    });
  });

  it('should ...', inject([OnboardingService], (service: OnboardingService) => {
    expect(service).toBeTruthy();
  }));
});
