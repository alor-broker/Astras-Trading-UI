import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TerminalSettingsComponent } from './terminal-settings.component';
import {
  mockComponent,
  commonTestProviders,
  sharedModuleImportForTests
} from '../../../../shared/utils/testing';
import {Subject} from 'rxjs';
import {AccountService} from "../../../../shared/services/account.service";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";

describe('TerminalSettingsComponent', () => {
  let component: TerminalSettingsComponent;
  let fixture: ComponentFixture<TerminalSettingsComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [
        TerminalSettingsComponent,
        mockComponent({selector: 'ats-useful-links'}),
        mockComponent({selector: 'ats-general-settings-form'}),
        mockComponent({selector: 'ats-portfolios-currency-form'}),
        mockComponent({selector: 'ats-hot-key-settings-form'}),
        mockComponent({selector: 'ats-instant-notifications-form'}),
      ],
      providers: [
        {
          provide: AccountService,
          useValue: {
            getFullName: jasmine.createSpy('getFullName').and.returnValue(new Subject())
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
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
