import {TestBed} from '@angular/core/testing';
import {
  firstValueFrom,
  Observable,
  of
} from 'rxjs';
import {ApiTokenProviderService} from './api-token-provider.service';
import {TokenState} from './api-token-provider.types';

describe('ApiTokenProviderService', () => {
  let service: ApiTokenProviderService;
  let refreshCallback: () => Observable<boolean>;
  let refreshCallbackSpy: ReturnType<typeof vi.fn>;

  function createTokenState(overrides: Partial<TokenState> = {}): TokenState {
    return {
      token: 'token',
      expirationTime: Date.now() + 60_000,
      refreshCallback,
      ...overrides
    };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    refreshCallbackSpy = vi.fn().mockReturnValue(of(true));
    refreshCallback = refreshCallbackSpy as () => Observable<boolean>;

    TestBed.configureTestingModule({
      providers: [ApiTokenProviderService]
    });

    service = TestBed.inject(ApiTokenProviderService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    vi.useRealTimers();
  });

  it('should emit the current token while it is still valid', async () => {
    service.updateTokenState(createTokenState({token: 'valid-token'}));

    const token$ = firstValueFrom(service.getToken());
    await vi.advanceTimersByTimeAsync(1000);

    await expect(token$).resolves.toBe('valid-token');
    expect(refreshCallbackSpy).not.toHaveBeenCalled();
  });

  it('should refresh an expired token and emit the refreshed token state', async () => {
    refreshCallbackSpy.mockImplementation(() => {
      service.updateTokenState(createTokenState({
        token: 'refreshed-token',
        expirationTime: Date.now() + 60_000
      }));

      return of(true);
    });

    service.updateTokenState(createTokenState({
      token: 'expired-token',
      expirationTime: Date.now() - 1000
    }));

    const token$ = firstValueFrom(service.getToken());
    await vi.advanceTimersByTimeAsync(1000);

    await expect(token$).resolves.toBe('refreshed-token');
    expect(refreshCallbackSpy).toHaveBeenCalledTimes(1);
  });

  it('should not emit a token after the token state is cleared', async () => {
    service.updateTokenState(createTokenState({token: 'valid-token'}));
    service.clearToken();

    const tokenSpy = vi.fn();
    const subscription = service.getToken().subscribe(tokenSpy);
    await vi.advanceTimersByTimeAsync(1000);

    expect(tokenSpy).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
