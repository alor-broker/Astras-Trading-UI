import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AdminProfileMenuNavBtnComponent} from './admin-profile-menu-nav-btn.component';
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {EMPTY} from "rxjs";
import {SESSION_CONTEXT} from "../../../shared/services/auth/session-context";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {MockDirective} from "ng-mocks";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('AdminProfileMenuNavBtnComponent', () => {
  let component: AdminProfileMenuNavBtnComponent;
  let fixture: ComponentFixture<AdminProfileMenuNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AdminProfileMenuNavBtnComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzIconDirective)
      ],
      providers: [
        {
          provide: EnvironmentService,
          useValue: {
            externalLinks: {
              releases: '',
              support: '',
              issuesList: ''
            }
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
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AdminProfileMenuNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
