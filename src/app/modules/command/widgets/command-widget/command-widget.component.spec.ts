import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

import { CommandWidgetComponent } from './command-widget.component';

describe('CommandWidgetComponent', () => {
  let component: CommandWidgetComponent;
  let fixture: ComponentFixture<CommandWidgetComponent>;

  const syncSpy = jasmine.createSpyObj('SyncService', ['commandParams$']);
  const commandSpy = jasmine.createSpyObj('CommandsService', ['submitLimitCommand']);
  syncSpy.commandParams$ = of();
  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [ CommandWidgetComponent ],
      providers: [
        { provide: SyncService, useValue: syncSpy },
        { provide: CommandsService, useValue: commandSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
