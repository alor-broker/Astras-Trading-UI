import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from 'src/app/shared/services/auth.service';

import { LoginFormComponent } from './login-form.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { BehaviorSubject } from 'rxjs';

describe('LoginFormComponent', () => {
  let component: LoginFormComponent;
  let fixture: ComponentFixture<LoginFormComponent>;
  const isAuthorisedMock$ = new BehaviorSubject(false);
  const authServiceSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthorised$']);
  authServiceSpy.isAuthorised$ = isAuthorisedMock$;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        ...sharedModuleImportForTests
      ],
      declarations: [LoginFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceSpy }]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoginFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
