import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { ModalService } from 'src/app/shared/services/modal.service';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';
import { LoggerService } from "../../../../shared/services/logger.service";

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'commandParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.commandParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);
  const loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StopCommandComponent ],
      providers: [
        { provide: ModalService, useValue: spyModal },
        { provide: CommandsService, useValue: spyCommands },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopCommandComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      quantity: new FormControl(0),
      triggerPrice: new FormControl(0),
      condition: new FormControl(StopOrderCondition.More)} as StopFormControls) as StopFormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
