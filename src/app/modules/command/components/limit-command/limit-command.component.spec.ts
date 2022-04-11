import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';
import { LoggerService } from "../../../../shared/services/logger.service";

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'commandParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.commandParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);
  const loggerSpy = jasmine.createSpyObj('LoggerService', ['error']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitCommandComponent ],
      providers: [
        { provide: ModalService, useValue: spyModal },
        { provide: CommandsService, useValue: spyCommands },
        { provide: LoggerService, useValue: loggerSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({ quantity: new FormControl(0), price: new FormControl(0)} as LimitFormControls) as LimitFormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
