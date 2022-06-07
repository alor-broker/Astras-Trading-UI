import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { LimitEditComponent } from './limit-edit.component';

describe('LimitEditComponent', () => {
  let component: LimitEditComponent;
  let fixture: ComponentFixture<LimitEditComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LimitEditComponent],
      providers: [
        { provide: CommandsService, useValue: spyCommands }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitEditComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({
      quantity: new FormControl(0),
      price: new FormControl(0)
    } as LimitFormControls) as LimitFormGroup;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
