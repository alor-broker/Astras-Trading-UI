import {TestBed} from '@angular/core/testing';
import {JoyrideService} from 'ngx-joyride';
import {OnboardingService} from './onboarding.service';
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import { TranslatorService } from "../../../shared/services/translator.service";

describe('OnboardingService', () => {
  let service: OnboardingService;
  let localStorageServiceSpy: any;
  let joyrideServiceSpy: any;
  let translatorServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    joyrideServiceSpy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
    translatorServiceSpy = jasmine.createSpyObj('TranslatorServiceSpy', ['getTranslator']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        {provide: JoyrideService, useValue: joyrideServiceSpy},
        {provide: LocalStorageService, useValue: localStorageServiceSpy},
        {provide: TranslatorService, useValue: translatorServiceSpy}
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
