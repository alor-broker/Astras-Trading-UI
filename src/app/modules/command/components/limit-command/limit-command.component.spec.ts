import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { LimitFormControls, LimitFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';
import { CommandParams } from '../../../../shared/models/commands/command-params.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

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

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
