import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';

import { ApplicationMetaService } from './application-meta.service';
import { LocalStorageService } from '../../../shared/services/local-storage.service';
import { take } from 'rxjs';


describe('ApplicationMetaService', () => {
  let service: ApplicationMetaService;

  let localStorageServiceSpy: any;

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['setItem', 'getItem']);
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
    service = TestBed.inject(ApplicationMetaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should update CurrentVersion in local storage', () => {
    service.updateCurrentVersion();

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledOnceWith(
      'version',
      service.currentVersion
    );
  });

  it('should update savedVersion$', fakeAsync(() => {
    const savedVersion = '0.0.0';
    localStorageServiceSpy.getItem.and.returnValue(savedVersion);
    tick();

    service.savedVersion$.pipe(
      take(1)
    ).subscribe(version => {
      expect(version).toEqual(savedVersion);
    });

    localStorageServiceSpy.getItem.and.returnValue(service.currentVersion);
    service.updateCurrentVersion();

    tick();
    service.savedVersion$.pipe(
      take(1)
    ).subscribe(version => {
      expect(version).toEqual(service.currentVersion);
    });
  }));
});
