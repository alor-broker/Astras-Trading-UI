import {TestBed} from '@angular/core/testing';
import {LocalStorageService} from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    // localStorage is a browser global the service uses directly — stub it with an
    // in-memory implementation so tests stay deterministic (testing-lib rule 18).
    vi.stubGlobal('localStorage', {
      getItem: (key: string): string | null => (key in store ? store[key] : null),
      setItem: (key: string, value: string): void => {
        store[key] = String(value);
      },
      removeItem: (key: string): void => {
        delete store[key];
      },
      clear: (): void => {
        store = {};
      }
    });

    TestBed.configureTestingModule({
      providers: [LocalStorageService]
    });

    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('setItem / getItem', () => {
    it('should serialize and read back a structured value', () => {
      service.setItem('settings', {theme: 'dark', count: 2});

      expect(service.getItem('settings')).toEqual({theme: 'dark', count: 2});
    });

    it('should return undefined for a missing key', () => {
      expect(service.getItem('missing')).toBeUndefined();
    });
  });

  describe('setStringItem / getStringItem', () => {
    it('should store and read a raw string without JSON wrapping', () => {
      service.setStringItem('token', 'abc');

      expect(service.getStringItem('token')).toBe('abc');
      expect(store['token']).toBe('abc');
    });

    it('should return null for a missing key', () => {
      expect(service.getStringItem('missing')).toBeNull();
    });
  });

  describe('removeItem', () => {
    it('should delete a stored value', () => {
      service.setStringItem('token', 'abc');

      service.removeItem('token');

      expect(service.getStringItem('token')).toBeNull();
    });
  });

  describe('getItemStream', () => {
    it('should emit the current value on subscription and again when the key changes', () => {
      service.setItem('counter', 1);

      const emissions: (number | undefined)[] = [];
      const sub = service.getItemStream<number>('counter').subscribe(v => emissions.push(v));

      service.setItem('counter', 2);
      sub.unsubscribe();

      expect(emissions).toEqual([1, 2]);
    });

    it('should not emit when an unrelated key changes', () => {
      service.setItem('counter', 1);

      const emissions: (number | undefined)[] = [];
      const sub = service.getItemStream<number>('counter').subscribe(v => emissions.push(v));

      service.setItem('other', 99);
      sub.unsubscribe();

      expect(emissions).toEqual([1]);
    });
  });
});
