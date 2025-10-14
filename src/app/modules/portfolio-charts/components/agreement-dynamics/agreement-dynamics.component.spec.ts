import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AgreementDynamicsComponent } from './agreement-dynamics.component';
import { MockProvider } from "ng-mocks";
import { ThemeService } from "../../../../shared/services/theme.service";
import { EMPTY } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { USER_CONTEXT } from "../../../../shared/services/auth/user-context";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ErrorHandlerService } from "../../../../shared/services/handle-error/error-handler.service";

describe('AgreementDynamicsComponent', () => {
  let component: AgreementDynamicsComponent;
  let fixture: ComponentFixture<AgreementDynamicsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AgreementDynamicsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          ThemeService,
          {
            getThemeSettings: () => EMPTY
          }
        ),

        // For some reason unable to override AccountService for this component. Probably because if providedIn: 'any'
        MockProvider(USER_CONTEXT),
        provideHttpClient(),
        provideHttpClientTesting(),
        MockProvider(ErrorHandlerService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AgreementDynamicsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
