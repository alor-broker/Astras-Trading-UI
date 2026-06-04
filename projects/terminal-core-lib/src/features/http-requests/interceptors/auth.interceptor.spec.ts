import {HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import {HttpClient, HttpContext} from '@angular/common/http';
import {TestBed} from '@angular/core/testing';
import {of} from 'rxjs';
import {AuthInterceptor} from './auth.interceptor';
import {ApiTokenProviderService} from '../services/api-token-provider.service';
import {HttpContextTokens} from '../constants/http.constants';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let getToken: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getToken = vi.fn().mockReturnValue(of('access-token'));

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        {provide: ApiTokenProviderService, useValue: {getToken}},
        {
          provide: HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should attach the bearer token to authorized requests', () => {
    httpClient.get('/orders').subscribe();

    const req = httpTestingController.expectOne('/orders');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-token');
    req.flush({});
  });

  it('should not request or attach a token when authorization is skipped', () => {
    httpClient.get('/public', {
      context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
    }).subscribe();

    const req = httpTestingController.expectOne('/public');
    expect(req.request.headers.has('Authorization')).toBe(false);
    expect(getToken).not.toHaveBeenCalled();
    req.flush({});
  });
});
