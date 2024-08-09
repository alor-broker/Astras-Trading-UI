import { TestBed } from '@angular/core/testing';

import { EnvironmentService } from './environment.service';
import { LocalStorageService } from "./local-storage.service";

describe('EnvironmentService', () => {
  let service: EnvironmentService;

  let localStorageServiceSpy: any;

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getStringItem']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy
        }
      ]
    });
    service = TestBed.inject(EnvironmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return overridden values', () => {
    const overriddenValues = [
      "apiUrl",
      "wsUrl",
      "clientDataUrl",
      "ssoUrl",
      "warpUrl",
      "remoteSettingsStorageUrl"
    ];

    overriddenValues.forEach(value => {
      localStorageServiceSpy.getStringItem.and.returnValue(value);

      const returnedValue = (service as any)[value];
      expect(returnedValue).toBe(value);
    });
  });
});
