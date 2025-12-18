import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ExternalLogoutPageComponent } from './external-logout-page.component';
import { ClientAuthContextService } from "../../services/auth/client-auth-context.service";

describe('ExternalLogoutPageComponent', () => {
  let component: ExternalLogoutPageComponent;
  let fixture: ComponentFixture<ExternalLogoutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [ExternalLogoutPageComponent],
    providers: [
        {
            provide: ClientAuthContextService,
            useValue: {
                forceLogout: jasmine.createSpy('forceLogout').and.callThrough()
            }
        }
    ]
})
      .compileComponents();

    fixture = TestBed.createComponent(ExternalLogoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
