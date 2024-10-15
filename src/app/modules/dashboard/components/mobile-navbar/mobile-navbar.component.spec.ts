import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileNavbarComponent } from './mobile-navbar.component';
import {
  EMPTY,
  of
} from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { EffectsModule } from "@ngrx/effects";
import { StoreModule } from "@ngrx/store";
import { PortfoliosFeature } from "../../../../store/portfolios/portfolios.reducer";
import { HelpService } from "../../../../shared/services/help.service";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { InstrumentSearchMockComponent } from "../../../../shared/utils/testing/instrument-search-mock-component";
import { FormsModule } from "@angular/forms";
import { SESSION_CONTEXT } from "../../../../shared/services/auth/session-context";

describe('MobileNavbarComponent', () => {
  let component: MobileNavbarComponent;
  let fixture: ComponentFixture<MobileNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MobileNavbarComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({selector: 'ats-notification-button'}),
        ComponentHelpers.mockComponent({selector: 'ats-network-indicator'})
      ],
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        TranslocoTestsModule.getModule(),
        InstrumentSearchMockComponent,
        FormsModule
      ],
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            selectedDashboard$: of({}),
            instrumentsSelection$: of({}),
            selectDashboardPortfolio: jasmine.createSpy('selectDashboardPortfolio').and.callThrough(),
            selectDashboardInstrument: jasmine.createSpy('selectDashboardInstrument').and.callThrough()
          }
        },
        {
          provide: ModalService,
          useValue: {
            openTerminalSettingsModal: jasmine.createSpy('openTerminalSettingsModal').and.callThrough()
          }
        },
        {
          provide: HelpService,
          useValue: {
            getHelpLink: jasmine.createSpy('getHelpLink').and.returnValue(EMPTY)
          }
        },
        {
          provide: SESSION_CONTEXT,
          useValue: {
            logout: jasmine.createSpy('logout').and.callThrough()
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MobileNavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
