import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { LoginFormComponent } from 'src/app/modules/login/components/login-form/login-form.component';
import { AuthService } from './auth.service';
import { LocalStorageService } from "./local-storage.service";

describe('AuthService', () => {
  let service: AuthService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let localStorageServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([{ path: 'login', pathMatch: 'full', component: LoginFormComponent },])
      ],
      providers: [
        AuthService,
        RouterTestingModule,
        HttpClientTestingModule,
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
      ]
    });
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    service = TestBed.inject(AuthService);
  });

  it('should inject', () => {
    expect(service).toBeTruthy();
  });
});
