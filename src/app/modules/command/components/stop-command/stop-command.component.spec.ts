import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setStopCommand']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StopCommandComponent],
      providers: [
        { provide: CommandsService, useValue: spyCommands }
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
