import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { LimitEditComponent } from './limit-edit.component';

describe('LimitEditComponent', () => {
  let component: LimitEditComponent;
  let fixture: ComponentFixture<LimitEditComponent>;

  const spySync = jasmine.createSpyObj('SyncService', ['shouldShowCommandModal$', 'editParams$']);
  spySync.shouldShowCommandModal$ = of(false);
  spySync.editParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitEditComponent ],
      providers: [
        { provide: SyncService, useValue: spySync },
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
