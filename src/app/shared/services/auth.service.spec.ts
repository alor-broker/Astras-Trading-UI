import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService} from './auth.service';
import {LocalStorageService} from "./local-storage.service";
import {Subject, take} from "rxjs";
import {ErrorHandlerService} from './handle-error/error-handler.service';
import {BroadcastService} from './broadcast.service';
import { EnvironmentService } from "./environment.service";

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  const clientDataUrl = 'clientDataUrl';
  const refreshUrl = clientDataUrl + '/auth/actions/refresh';

  let localStorageServiceSpy: any;
  const windowAssignSpy = jasmine.createSpy('assign').and.callThrough();

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    localStorageServiceSpy = {
      getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
      setItem: jasmine.createSpy('setItem').and.callThrough(),
      removeItem: jasmine.createSpy('removeItem').and.callThrough()
    };

    await TestBed.configureTestingModule({
    imports: [],
    providers: [
        AuthService,
        RouterTestingModule,
        {
            provide: LocalStorageService,
            useValue: localStorageServiceSpy
        },
        {
            provide: Window,
            useValue: {
                location: {
                    assign: windowAssignSpy
                }
            }
        },
        {
            provide: ErrorHandlerService,
            useValue: {
                handleError: jasmine.createSpy('handleError').and.callThrough()
            }
        },
        {
            provide: BroadcastService,
            useValue: {
                subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
            }
        },
        {
            provide: EnvironmentService,
            useValue: {
                clientDataUrl,
                ssoUrl: ''
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should inject', () => {
    expect(service).toBeTruthy();
  });

  it('should refresh token at start', () => {
    service.setRefreshToken('refreshToken');
    service.accessToken$.pipe(take(1)).subscribe();

    const request = httpTestingController.expectOne(refreshUrl);
    expect(request.request.method).toEqual('POST');
  });

  it('should logout when logout call', () => {
    service.accessToken$.pipe(take(1)).subscribe();
    service.logout();
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalled();
    expect(windowAssignSpy).toHaveBeenCalled();
  });

  it('should redirect to login if token expired', () => {
    const expDate = new Date();
    expDate.setDate(expDate.getDate() - 1);

    service.setRefreshToken('refreshToken');
    service.accessToken$.pipe(take(1)).subscribe();

    const firstRefresh = httpTestingController.expectOne(refreshUrl);
    firstRefresh.flush({
      jwt: 'login.' + btoa(JSON.stringify({
        portfolios: 'testPortfolio',
        clientid: '1',
        exp: expDate.getTime() / 1000
      }))
    });

    service.accessToken$.pipe(take(1)).subscribe();
    expect(windowAssignSpy).toHaveBeenCalled();
  });

  it('should refresh token after expiration', fakeAsync(() => {
      const expDate = new Date();
      expDate.setMinutes(expDate.getMinutes() + 1);
      const expTimestamp = expDate.getTime() / 1000;

      service.setRefreshToken('refreshToken');
      service.accessToken$.pipe(take(1)).subscribe();

      const firstRefresh = httpTestingController.expectOne(refreshUrl);
      firstRefresh.flush({
        jwt: 'login.' + btoa(JSON.stringify({
          portfolios: 'testPortfolio',
          clientid: '1',
          exp: expTimestamp
        }))
      });

      tick(5 * 60 * 1000);

      const requests = httpTestingController.match(refreshUrl);
      expect(requests.length).toBeGreaterThan(1);
      discardPeriodicTasks();
    })
  );
});
