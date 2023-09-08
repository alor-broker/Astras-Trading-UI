import {TestBed} from '@angular/core/testing';
import {JoyrideService} from 'ngx-joyride';
import {OnboardingService} from './onboarding.service';
import {LocalStorageService} from "../../../shared/services/local-storage.service";

describe('OnboardingService', () => {
  let service: OnboardingService;
  let localStorageServiceSpy: any;
  let joyrideServiceSpy: any;


  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    joyrideServiceSpy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        {provide: JoyrideService, useValue: joyrideServiceSpy},
        {provide: LocalStorageService, useValue: localStorageServiceSpy}
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
