import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './auth.service';
import { LocalStorageService } from "./local-storage.service";
import { environment } from "../../../environments/environment";
import { User } from "../models/user/user.model";
import { of, skip, take } from "rxjs";

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let localStorageServiceSpy: any;

  let userMock: User;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    userMock = {
      login: 'login',
      refreshToken: 'token',
      jwt: 'login.' + btoa(JSON.stringify({
        portfolios: 'testPortfolio',
        clientid: '1',
        sub: 'login'
      })),
      isLoggedOut: false,
      clientId: '1',
      portfolios: ['testPortfolio'],
    };

    localStorageServiceSpy = {
      getItem: jasmine.createSpy('getItem').and.returnValue({}),
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
              assign: jasmine.createSpy('assign').and.callThrough()
            }
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

  it('should update local storage and user sub when setUser called', () => {
    service.setUser(userMock);

    expect(localStorageServiceSpy.setItem).toHaveBeenCalledOnceWith('user', userMock);
    service.currentUser$.pipe(take(1)).subscribe(user => {
      expect(user).toEqual(userMock);
    });
  });

  it('should logout when logout call', () => {
    service.currentUser$.pipe(
      skip(1),
      take(1)
    )
      .subscribe(user => {
        expect(user).toEqual({
          login: '',
          jwt: '',
          clientId: '',
          refreshToken: '',
          portfolios: [],
          isLoggedOut: true
        });
      });

    service.logout();
    expect(localStorageServiceSpy.removeItem).toHaveBeenCalled();
  });

  it('should correctly check authorization', () => {
    let expDate = new Date();
    expDate.setDate(expDate.getDate() + 1);
    let expTimestamp = expDate.getTime()/1000;

    userMock.jwt = 'login.' + btoa(JSON.stringify({
      portfolios: 'testPortfolio',
      clientid: '1',
      exp: expTimestamp
    }));

    expect(service.isAuthorised(userMock)).toBeTruthy();

    expDate = new Date();
    expDate.setDate(expDate.getDate() - 1);
    expTimestamp = expDate.getTime()/1000;

    userMock.jwt = 'login.' + btoa(JSON.stringify({
      portfolios: 'testPortfolio',
      clientid: '1',
      exp: expTimestamp
    }));

    expect(service.isAuthorised(userMock)).toBeFalsy();
  });

  it('should correctly check auth request', () => {
    let authUrl = environment.clientDataUrl + '/auth/actions/login';
    expect(service.isAuthRequest(authUrl)).toBeTruthy();

    authUrl = environment.clientDataUrl + '/auth/actions/refresh';
    expect(service.isAuthRequest(authUrl)).toBeTruthy();

    authUrl = environment.clientDataUrl + '/auth/actions/not-auth';
    expect(service.isAuthRequest(authUrl)).toBeFalsy();
  });

  it('should refresh token', () => {
    const refreshRes = { jwt: 'test.' + btoa(JSON.stringify({
        portfolios: 'testPortfolio2',
        clientid: '2'
      }))
    };

    service.setUser(userMock);
    const setUserSpy = spyOn(service, 'setUser').and.callThrough();

    service.refresh()
      .subscribe(() => {
        expect(setUserSpy).toHaveBeenCalledOnceWith({ ...userMock, ...refreshRes });
      });

    const req = httpTestingController.expectOne(environment.clientDataUrl + '/auth/actions/refresh');

    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual({ oldJwt: userMock.jwt, refreshToken: userMock.refreshToken });

    req.flush(refreshRes);
  });

  it('should not refresh token', () => {
    service.setUser({...userMock, isLoggedOut: true});
    service.redirectToSso = jasmine.createSpy('redirectToSso').and.callThrough();

    const setUserSpy = spyOn(service, 'setUser').and.callThrough();

    service.refresh()
      .subscribe(() => {
      });
    expect(setUserSpy).not.toHaveBeenCalled();
    expect(service.redirectToSso).toHaveBeenCalled();
  });

  it('should correctly return access token', fakeAsync(() => {
    service.refresh = jasmine.createSpy('refresh').and.returnValue(of(null));

    let expDate = new Date();
    expDate.setDate(expDate.getDate() + 1);
    let expTimestamp = expDate.getTime()/1000;

    userMock.jwt = 'login.' + btoa(JSON.stringify({
      portfolios: 'testPortfolio',
      clientid: '1',
      exp: expTimestamp
    }));

    service.setUser(userMock);

    service.accessToken$
      .pipe(take(1))
      .subscribe(res => expect(res).toEqual(userMock.jwt));

    tick();

    expect(service.refresh).not.toHaveBeenCalled();

    expDate = new Date();
    expDate.setDate(expDate.getDate() - 1);
    expTimestamp = expDate.getTime()/1000;

    userMock.jwt = 'login.' + btoa(JSON.stringify({
      portfolios: 'testPortfolio',
      clientid: '1',
      exp: expTimestamp
    }));

    service.setUser(userMock);

    service.accessToken$
      .pipe(take(1))
      .subscribe(res => expect(res).toBeFalsy());

    tick();

    expect(service.refresh).toHaveBeenCalled();

    discardPeriodicTasks();
  }));
});
