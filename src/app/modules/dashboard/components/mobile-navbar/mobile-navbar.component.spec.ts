import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MobileNavbarComponent } from './mobile-navbar.component';
import { of } from "rxjs";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { mockComponent, ngZorroMockComponents, sharedModuleImportForTests } from "../../../../shared/utils/testing";
import { ModalService } from "../../../../shared/services/modal.service";

describe('MobileNavbarComponent', () => {
  let component: MobileNavbarComponent;
  let fixture: ComponentFixture<MobileNavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MobileNavbarComponent,
        ...ngZorroMockComponents,
        mockComponent({selector: 'ats-notification-button'})
      ],
      imports: [...sharedModuleImportForTests],
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
        }
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
