import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { LimitEditComponent } from './limit-edit.component';

describe('LimitEditComponent', () => {
  let component: LimitEditComponent;
  let fixture: ComponentFixture<LimitEditComponent>;

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'editParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.editParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitEditComponent ],
      providers: [
        { provide: ModalService, useValue: spyModal },
        { provide: CommandsService, useValue: spyCommands }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitEditComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({ quantity: new FormControl(0), price: new FormControl(0)} as LimitFormControls) as LimitFormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
