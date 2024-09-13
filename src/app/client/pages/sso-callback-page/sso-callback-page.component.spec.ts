import { SsoCallbackPageComponent } from './sso-callback-page.component';
import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { provideRouter } from "@angular/router";
import { ClientAuthContextService } from "../../services/client-auth-context.service";

describe('SsoCallbackPageComponent', () => {
  let component: SsoCallbackPageComponent;
  let fixture: ComponentFixture<SsoCallbackPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SsoCallbackPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ClientAuthContextService,
          useValue: {
            setRefreshToken: jasmine.createSpy('setRefreshToken').and.callThrough()
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(SsoCallbackPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
