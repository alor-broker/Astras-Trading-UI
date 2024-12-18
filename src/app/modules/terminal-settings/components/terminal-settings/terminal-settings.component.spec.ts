import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalSettingsComponent } from './terminal-settings.component';
import {Subject} from 'rxjs';
import {AccountService} from "../../../../shared/services/account.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import { ModalService } from "../../../../shared/services/modal.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from 'src/app/shared/utils/testing/component-helpers';
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { MockProvider } from "ng-mocks";
import { EXPORT_SETTINGS_SERVICE_TOKEN } from "../../../../shared/services/settings/export-settings.service";

describe('TerminalSettingsComponent', () => {
  let component: TerminalSettingsComponent;
  let fixture: ComponentFixture<TerminalSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule()
      ],
      declarations: [
        TerminalSettingsComponent,
        ComponentHelpers.mockComponent({selector: 'ats-useful-links'}),
        ComponentHelpers.mockComponent({selector: 'ats-general-settings-form'}),
        ComponentHelpers.mockComponent({selector: 'ats-portfolios-currency-form'}),
        ComponentHelpers.mockComponent({selector: 'ats-hot-key-settings-form'}),
        ComponentHelpers.mockComponent({selector: 'ats-instant-notifications-form'}),
      ],
      providers: [
        MockProvider(
          AccountService,
          {
            getFullName: jasmine.createSpy('getFullName').and.returnValue(new Subject())
          }
        ),
        MockProvider(
          TerminalSettingsService,
          {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        ),
        MockProvider(
          ModalService,
          {
            openConfirmModal: jasmine.createSpy('openConfirmModal').and.callThrough()
          }
        ),
        MockProvider(
          EXPORT_SETTINGS_SERVICE_TOKEN,
          {
            exportToFile: jasmine.createSpy('exportToFile').and.callThrough()
          }
        ),
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
