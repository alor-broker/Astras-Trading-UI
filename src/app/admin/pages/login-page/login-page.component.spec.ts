import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPageComponent } from './login-page.component';
import { AdminIdentityService } from "../../services/identity/admin-identity.service";
import { EMPTY } from "rxjs";
import { provideHttpClient } from "@angular/common/http";
import { TranslocoTestsModule } from "../../../shared/utils/testing/translocoTestsModule";

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LoginPageComponent
      ],
      providers: [
        {
          provide: AdminIdentityService,
          useValue: {
            login: jasmine.createSpy('login').and.returnValue(EMPTY)
          }
        },
        provideHttpClient()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LoginPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
