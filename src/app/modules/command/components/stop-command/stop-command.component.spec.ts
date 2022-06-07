import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';
import { of } from 'rxjs';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setStopCommand']);

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopCommandComponent],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
