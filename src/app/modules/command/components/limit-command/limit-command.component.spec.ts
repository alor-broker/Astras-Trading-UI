import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';
import { of } from "rxjs";

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand', 'priceSelected$']);
  spyCommands.priceSelected$ = of(1);


  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LimitCommandComponent],
      providers: [
        { provide: CommandsService, useValue: spyCommands }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
