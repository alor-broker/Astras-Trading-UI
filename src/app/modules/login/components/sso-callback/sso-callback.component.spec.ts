import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SsoCallbackComponent } from './sso-callback.component';
import { RouterTestingModule } from '@angular/router/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from 'src/app/modules/dashboard/components/dashboard/dashboard.component';
import { AuthService } from '../../../../shared/services/auth.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('SsoCallbackComponent', () => {
  let component: SsoCallbackComponent;
  let fixture: ComponentFixture<SsoCallbackComponent>;

  let authServiceSpy: any;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['setUser']);
  });

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach((async () => {
    await TestBed.configureTestingModule({
    declarations: [SsoCallbackComponent],
    imports: [RouterTestingModule.withRoutes([{ path: 'dashboard', pathMatch: 'full', component: DashboardComponent }])],
    providers: [
        RouterTestingModule,
        {
            provide: AuthService,
            useValue: authServiceSpy
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
})
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SsoCallbackComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
