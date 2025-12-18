import {ComponentFixture, TestBed} from '@angular/core/testing';
import {MobileNavbarComponent} from './mobile-navbar.component';
import {EMPTY, of} from "rxjs";
import {StoreModule} from "@ngrx/store";
import {EffectsModule} from "@ngrx/effects";
import {PortfoliosFeature} from "../../../store/portfolios/portfolios.reducer";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {DashboardContextService} from "../../../shared/services/dashboard-context.service";
import {ModalService} from "../../../shared/services/modal.service";
import {HelpService} from "../../../shared/services/help.service";
import {SESSION_CONTEXT} from "../../../shared/services/auth/session-context";
import {commonTestProviders} from "../../../shared/utils/testing/common-test-providers";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzHeaderComponent} from "ng-zorro-antd/layout";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzDropDownDirective, NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzPopoverDirective} from "ng-zorro-antd/popover";
import {NzMenuDirective, NzMenuDividerDirective, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzDrawerComponent, NzDrawerContentDirective} from "ng-zorro-antd/drawer";
import {InstrumentSearchComponent} from "../../../shared/components/instrument-search/instrument-search.component";
import {
  NetworkIndicatorComponent
} from "../../../modules/dashboard/components/network-indicator/network-indicator.component";
import {ExternalLinkComponent} from "../../../shared/components/external-link/external-link.component";
import {
  NotificationButtonComponent
} from "../../../modules/notifications/components/notification-button/notification-button.component";

describe('MobileNavbarComponent', () => {
  let component: MobileNavbarComponent;
  let fixture: ComponentFixture<MobileNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
        MobileNavbarComponent,
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(PortfoliosFeature),
        TranslocoTestsModule.getModule(),
      MockComponents(
        NzHeaderComponent,
        NzButtonComponent,
        NzDropdownMenuComponent,
        NzMenuItemComponent,
        NzDrawerComponent,
        InstrumentSearchComponent,
        NetworkIndicatorComponent,
        ExternalLinkComponent,
        NotificationButtonComponent
      ),
      MockDirectives(
        NzIconDirective,
        NzDropDownDirective,
        NzPopoverDirective,
        NzMenuDirective,
        NzInputDirective,
        NzDrawerContentDirective,
        NzMenuDividerDirective,
      )
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
                getSectionHelp: jasmine.createSpy('getSectionHelp').and.returnValue(EMPTY)
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
