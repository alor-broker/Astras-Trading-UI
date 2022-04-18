/* tslint:disable:no-unused-variable */

import { TestBed, inject } from '@angular/core/testing';
import { OnboardingService } from './onboarding.service';

describe('Service: Onboarding', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [OnboardingService]
    });
  });

  it('should ...', inject([OnboardingService], (service: OnboardingService) => {
    expect(service).toBeTruthy();
  }));
});
