import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';
import { ModalService } from 'src/app/shared/services/modal.service';
import { QuotesService } from 'src/app/shared/services/quotes.service';
import { MarketFormControls, MarketFormGroup } from '../../models/command-forms.model';
import { CommandsService } from '../../services/commands.service';

import { MarketCommandComponent } from './market-command.component';

describe('MarketCommandComponent', () => {
  let component: MarketCommandComponent;
  let fixture: ComponentFixture<MarketCommandComponent>;

  const spyModal = jasmine.createSpyObj('ModalService', ['shouldShowCommandModal$', 'commandParams$']);
  spyModal.shouldShowCommandModal$ = of(false);
  spyModal.commandParams$ = of(null);
  const spyCommands = jasmine.createSpyObj('CommandsService', ['setMarketCommand']);
  const quotesSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
  quotesSpy.getQuotes.and.returnValue(of(null));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MarketCommandComponent ],
      providers: [
        { provide: ModalService, useValue: spyModal },
        { provide: CommandsService, useValue: spyCommands },
        { provide: QuotesService, useValue: quotesSpy }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketCommandComponent);
    component = fixture.componentInstance;
    component.form = new FormGroup({ quantity: new FormControl(0) } as MarketFormControls) as MarketFormGroup;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
