import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';

import { TerminalSettingsWidgetComponent } from './terminal-settings-widget.component';
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";

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
        ...sharedModuleImportForTests,
        getTranslocoModule()
      ],
      providers: [
        { provide: ModalService, useValue: modalSpy },
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
