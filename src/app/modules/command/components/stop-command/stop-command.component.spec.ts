import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { StopOrderCondition } from 'src/app/shared/models/enums/stoporder-conditions';
import { ModalService } from 'src/app/shared/services/modal.service';
import { StopFormControls, StopFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';
import { CommandParams } from '../../../../shared/models/commands/command-params.model';

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  const testCommand$ = new BehaviorSubject<CommandParams>(<CommandParams> {
    price: 0
  });

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'commandParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.commandParams$ = testCommand$;
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StopCommandComponent ],
      providers: [
        { provide: ModalService, useValue: spyModal },
        { provide: CommandsService, useValue: spyCommands }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
