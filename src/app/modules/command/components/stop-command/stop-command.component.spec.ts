import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';
import { CommandParams } from '../../../../shared/models/commands/command-params.model';
import { TimezoneConverterService } from '../../../../shared/services/timezone-converter.service';
import { TimezoneConverter } from '../../../../shared/utils/timezone-converter';
import { TimezoneDisplayOption } from '../../../../shared/models/enums/timezone-display-option';

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  const testCommand$ = new BehaviorSubject<CommandParams>(<CommandParams>{
    price: 0
  });

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'commandParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.commandParams$ = testCommand$;
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

  const timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
  timezoneConverterServiceSpy.getConverter.and.returnValue(of(new TimezoneConverter(TimezoneDisplayOption.MskTime)));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopCommandComponent],
      providers: [
        { provide: ModalService, useValue: spyModal },
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
