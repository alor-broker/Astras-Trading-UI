import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';

import { TerminalSettingsWidgetComponent } from './terminal-settings-widget.component';
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { EMPTY } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { NzModalModule } from "ng-zorro-antd/modal";

describe('TerminalSettingsWidgetComponent', () => {
  let component: TerminalSettingsWidgetComponent;
  let fixture: ComponentFixture<TerminalSettingsWidgetComponent>;
  const modalSpy = jasmine.createSpyObj('ModalService', ['openHelpModal']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TerminalSettingsWidgetComponent,
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        NzModalModule
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
