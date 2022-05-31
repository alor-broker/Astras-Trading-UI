import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TerminalSettingsService } from '../../services/terminal-settings.service';

import { TerminalSettingsComponent } from './terminal-settings.component';
import { sharedModuleImportForTests } from '../../../../shared/utils/testing';
import { of } from 'rxjs';
import { TerminalSettings } from '../../../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';

describe('TerminalSettingsComponent', () => {
  let component: TerminalSettingsComponent;
  let fixture: ComponentFixture<TerminalSettingsComponent>;

  const tsSpy = jasmine.createSpyObj('TerminalSettingsService', ['getFullName', 'getSettings']);
  tsSpy.getSettings.and.returnValue(of({ timezoneDisplayOption: TimezoneDisplayOption.MskTime } as TerminalSettings));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      declarations: [TerminalSettingsComponent],
      providers: [
        { provide: TerminalSettingsService, useValue: tsSpy }
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
