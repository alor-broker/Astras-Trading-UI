import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { StopCommandComponent } from './stop-command.component';
import { CommandParams } from '../../../../shared/models/commands/command-params.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';

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

    component.instrument = {
      symbol: 'test'
    } as Instrument;

    component.command = {
      price: 0,
      instrument: component.instrument as InstrumentKey,
      user: {} as PortfolioKey
    } as CommandParams;

    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
