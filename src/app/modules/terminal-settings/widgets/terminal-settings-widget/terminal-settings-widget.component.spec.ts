import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ModalService} from 'src/app/shared/services/modal.service';

import {TerminalSettingsWidgetComponent} from './terminal-settings-widget.component';
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {EMPTY} from "rxjs";
import {commonTestProviders} from "../../../../shared/utils/testing/common-test-providers";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {TerminalSettingsComponent} from "../../components/terminal-settings/terminal-settings.component";

describe('TerminalSettingsWidgetComponent', () => {
  let component: TerminalSettingsWidgetComponent;
  let fixture: ComponentFixture<TerminalSettingsWidgetComponent>;
  const modalSpy = jasmine.createSpyObj('ModalService', ['openHelpModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TerminalSettingsWidgetComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          TerminalSettingsComponent
        )
      ],
      providers: [
        {
          provide: ModalService,
          useValue: modalSpy
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(EMPTY)
          }
        },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TerminalSettingsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
