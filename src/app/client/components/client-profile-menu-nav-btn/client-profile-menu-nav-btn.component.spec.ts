import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ClientProfileMenuNavBtnComponent} from './client-profile-menu-nav-btn.component';
import {MockDirective, MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../shared/services/environment.service";
import {HelpService} from "../../../shared/services/help.service";
import {EMPTY} from "rxjs";
import {SESSION_CONTEXT} from "../../../shared/services/auth/session-context";
import {ModalService} from "../../../shared/services/modal.service";
import {TranslocoTestsModule} from "../../../shared/utils/testing/translocoTestsModule";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('ClientProfileMenuNavBtnComponent', () => {
  let component: ClientProfileMenuNavBtnComponent;
  let fixture: ComponentFixture<ClientProfileMenuNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ClientProfileMenuNavBtnComponent,
        TranslocoTestsModule.getModule(),
        MockDirective(NzIconDirective)
      ],
      providers: [
        MockProvider(
          EnvironmentService,
          {
            externalLinks: {
              reports: '',
              releases: '',
              support: '',
              issuesList: '',
              help: '',
              officialSite: '',
              riskRate: '',
              personalAccount: '',
              bankroll: '',
              services: '',
              videoTutorial: ''
            }
          }
        ),
        MockProvider(
          HelpService,
          {
            getSectionHelp: () => EMPTY
          }
        ),
        MockProvider(SESSION_CONTEXT),
        MockProvider(ModalService),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ClientProfileMenuNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
