import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  const spySync = jasmine.createSpyObj('SyncService', ['shouldShowCommandModal$', 'commandParams$']);
  spySync.shouldShowCommandModal$ = of(false);
  spySync.commandParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['getQuotes']);
  const spyQuotes = jasmine.createSpyObj('QuotesService', ['getQuotes']);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitCommandComponent ],
      providers: [
        { provide: SyncService, useValue: spySync },
        { provide: CommandsService, useValue: spyCommands },
        { provide: QuotesService, useValue: spyQuotes },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
