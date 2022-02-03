import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

import { EditWidgetComponent } from './edit-widget.component';

describe('EditWidgetComponent', () => {
  let component: EditWidgetComponent;
  let fixture: ComponentFixture<EditWidgetComponent>;

  beforeEach(async () => {
    const syncSpy = jasmine.createSpyObj('SyncService', ['editParams$']);
    const commandSpy = jasmine.createSpyObj('CommandsService', ['submitLimitEdit']);
    syncSpy.editParams$ = of();
    await TestBed.configureTestingModule({
      declarations: [ EditWidgetComponent ],
      providers: [
        { provide: SyncService, useValue: syncSpy },
        { provide: CommandsService, useValue: commandSpy },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
