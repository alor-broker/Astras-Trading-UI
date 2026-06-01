import {TestBed} from '@angular/core/testing';
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {EnvironmentService} from './environment.service';
import {environment} from '../../environments/environment';

describe('EnvironmentService', () => {
  let service: EnvironmentService;
  let localStorageSpy: { getStringItem: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    localStorageSpy = {
      getStringItem: vi.fn().mockReturnValue(null)
    };

    TestBed.configureTestingModule({
      providers: [
        EnvironmentService,
        {
          provide: LocalStorageService,
          useValue: localStorageSpy
        }
      ]
    });

    service = TestBed.inject(EnvironmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fall back to the environment value when there is no debug override', () => {
    expect(service.apiUrl).toBe(environment.apiUrl);
  });

  it('should prefer the debug override from local storage', () => {
    localStorageSpy.getStringItem.mockReturnValue('https://override.example');

    expect(service.apiUrl).toBe('https://override.example');
    expect(localStorageSpy.getStringItem).toHaveBeenCalledWith('debug.apiUrl');
  });
});
