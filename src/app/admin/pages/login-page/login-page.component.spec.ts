import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoginPageComponent } from './login-page.component';
import { AdminIdentityService } from "../../services/identity/admin-identity.service";
import { EMPTY } from "rxjs";
import { getTranslocoModule } from "../../../shared/utils/testing";
import { provideHttpClient } from "@angular/common/http";

describe('LoginPageComponent', () => {
  let component: LoginPageComponent;
  let fixture: ComponentFixture<LoginPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
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
