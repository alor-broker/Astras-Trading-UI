import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { CommandsService } from '../../services/commands.service';

import { MarketCommandComponent } from './market-command.component';

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
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
