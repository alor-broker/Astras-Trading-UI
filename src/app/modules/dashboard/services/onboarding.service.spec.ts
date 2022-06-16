import { TestBed } from '@angular/core/testing';
import { JoyrideService } from 'ngx-joyride';
import { OnboardingService } from './onboarding.service';
import { LocalStorageService } from "../../../shared/services/local-storage.service";

describe('OnboardingService', () => {
  let service: OnboardingService;
  let localStorageServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    let spy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: JoyrideService, useValue: spy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
