import { TestBed } from '@angular/core/testing';
import { JoyrideService } from 'ngx-joyride';
import { OnboardingService } from './onboarding.service';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { of } from 'rxjs';
import {
  ThemeColors,
  ThemeSettings,
  ThemeType
} from '../../../shared/models/settings/theme-settings.model';
import { ThemeService } from '../../../shared/services/theme.service';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let localStorageServiceSpy: any;
  let joyrideServiceSpy: any;
  let themeServiceSpy: any;


  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    joyrideServiceSpy = jasmine.createSpyObj('JoyrideService', ['startTour']);
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
    themeServiceSpy = jasmine.createSpyObj('ThemeService', ['getThemeSettings']);
    themeServiceSpy.getThemeSettings.and.returnValue(of({
      theme: ThemeType.dark,
      themeColors: {
        sellColor: 'rgba(239,83,80, 1)',
        sellColorBackground: 'rgba(184, 27, 68, 0.4)',
        buyColor: 'rgba(12, 179, 130, 1',
        buyColorBackground: 'rgba(12, 179, 130, 0.4)',
        componentBackground: '#141414',
        primaryColor: '#177ddc',
        purpleColor: '#51258f',
        errorColor: '#a61d24'
      } as ThemeColors
    } as ThemeSettings));

  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        OnboardingService,
        { provide: JoyrideService, useValue: joyrideServiceSpy },
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
      ]
    });

    service = TestBed.inject(OnboardingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
