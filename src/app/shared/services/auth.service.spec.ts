import {HttpClient} from '@angular/common/http';
import {HttpClientTestingModule, HttpTestingController} from '@angular/common/http/testing';
import {discardPeriodicTasks, fakeAsync, TestBed, tick} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AuthService} from './auth.service';
import {LocalStorageService} from "./local-storage.service";
import {environment} from "../../../environments/environment";
import {User} from "../models/user/user.model";
import {Subject, take} from "rxjs";
import {ErrorHandlerService} from './handle-error/error-handler.service';
import {BroadcastService} from './broadcast.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;

  const refreshUrl = environment.clientDataUrl + '/auth/actions/refresh';

  let localStorageServiceSpy: any;
  let windowAssignSpy = jasmine.createSpy('assign').and.callThrough();

  let userMock: User;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    userMock = {
      login: 'login',
      clientId: '1',
      portfolios: ['testPortfolio'],
    };

    localStorageServiceSpy = {
      getItem: jasmine.createSpy('getItem').and.returnValue(undefined),
      setItem: jasmine.createSpy('setItem').and.callThrough(),
      removeItem: jasmine.createSpy('removeItem').and.callThrough()
    };

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
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
        }
      ]
    });
    httpClient = TestBed.inject(HttpClient);
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

  it('should correctly check auth request', () => {
    let authUrl = environment.clientDataUrl + '/auth/actions/login';
    expect(service.isAuthRequest(authUrl)).toBeTruthy();

    authUrl = refreshUrl;
    expect(service.isAuthRequest(authUrl)).toBeTruthy();

    authUrl = environment.clientDataUrl + '/auth/actions/not-auth';
    expect(service.isAuthRequest(authUrl)).toBeFalsy();
  });

  it('should redirect to login if token expired', () => {
    let expDate = new Date();
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
      let expDate = new Date();
      expDate.setMinutes(expDate.getMinutes() + 1);
      let expTimestamp = expDate.getTime() / 1000;

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
