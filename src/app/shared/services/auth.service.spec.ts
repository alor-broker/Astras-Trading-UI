import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { discardPeriodicTasks, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginFormComponent } from 'src/app/modules/login/components/login-form/login-form.component';
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
  let windowSpy: any;

  let userMock: User;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    userMock = {
      login: 'login',
      refreshToken: 'token',
      jwt: 'login.' + btoa(JSON.stringify({
        portfolios: 'testPortfolio',
        clientid: '1'
      })),
      isLoggedOut: false,
      clientId: '1',
      portfolios: ['testPortfolio']
    };

    localStorageServiceSpy = {
      getItem: jasmine.createSpy('getItem').and.returnValue({}),
      setItem: jasmine.createSpy('setItem').and.callThrough(),
      removeItem: jasmine.createSpy('removeItem').and.callThrough()
    };
    windowSpy = {
      location: {
        assign: jasmine.createSpy('assign').and.callThrough()
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'login', pathMatch: 'full', component: LoginFormComponent },])
      ],
      providers: [
        AuthService,
        RouterTestingModule,
        {
          provide: LocalStorageService,
          useValue: localStorageServiceSpy
        },
        {
          provide: 'Window',
          useValue: windowSpy
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

  it('should login', () => {
    const userRes = {
      ...userMock,
      clientId: 'login.' + btoa(JSON.stringify({clientid: userMock.clientId}))
    };

    const setUserSpy = spyOn(service, 'setUser').and.callThrough();

    service.login({ login: 'login', password: 'test password' })
      .subscribe(() => {
        expect(setUserSpy).toHaveBeenCalledOnceWith(userMock);
      });

    const req = httpTestingController.expectOne(environment.clientDataUrl + '/auth/actions/login');

    expect(req.request.method).toEqual('POST');

    req.flush(userRes);
  });

  it('should logout when logout call', () => {
    service.currentUser$.pipe(skip(1), take(1)).subscribe(user => {
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

    const setUserSpy = spyOn(service, 'setUser').and.callThrough();

    service.refresh()
      .subscribe(() => {
      });
    expect(setUserSpy).not.toHaveBeenCalled();
    expect(windowSpy.location.assign).toHaveBeenCalled();
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
