import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MarketFormControls, MarketFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { MarketCommandComponent } from './market-command.component';
import { CommandParams } from '../../../../shared/models/commands/command-params.model';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import { PortfolioKey } from '../../../../shared/models/portfolio-key.model';

describe('MarketCommandComponent', () => {
  let component: MarketCommandComponent;
  let fixture: ComponentFixture<MarketCommandComponent>;

  const spyCommands = jasmine.createSpyObj('CommandsService', ['setMarketCommand']);
  const quotesSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
  quotesSpy.getQuotes.and.returnValue(of(null));

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MarketCommandComponent],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
        { provide: QuotesService, useValue: quotesSpy }
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketCommandComponent);
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
