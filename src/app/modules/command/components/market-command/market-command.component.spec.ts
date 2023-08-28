import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { CommandContextModel } from "../../models/command-context.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import {
  commonTestProviders,
  getTranslocoModule,
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from "../../../../shared/utils/testing";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MarketCommandComponent } from "./market-command.component";
import { MarketCommand } from "../../models/market-command.model";
import { Quote } from "../../../../shared/models/quotes/quote.model";
import {BehaviorSubject, Subject} from "rxjs";
import { QuotesService } from "../../../../shared/services/quotes.service";
import ruCommand from '../../../../../assets/i18n/command/ru.json';
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';
import {InstrumentsService} from "../../../instruments/services/instruments.service";

describe('MarketCommandComponent', () => {
  let component: MarketCommandComponent;
  let fixture: ComponentFixture<MarketCommandComponent>;

  let spyCommands: any;

  const expectedPrice = 103;
  const quoteMock = new BehaviorSubject<Quote>({
    last_price: expectedPrice
  } as Quote);

  const getDefaultCommandContext: () => CommandContextModel<CommandParams> = () => {
    const instrument = TestData.instruments[0];
    return {
      instrument: instrument,
      commandParameters: {
        type: CommandType.Market,
        instrument: instrument,
        quantity: 15,
        user: {
          portfolio: 'D1234'
        } as PortfolioKey
      }
    };
  };


  const getFormInputs = () => {
    return {
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      instrumentGroup: 'SPBX'
    };
  };

  const getValidationErrorElement = (element: HTMLElement) => {
    const inputContainer = element.parentElement?.parentElement?.parentElement?.parentElement?.parentElement;
    if (!inputContainer) {
      return null;
    }

    const errorContainer = inputContainer.querySelector('.ant-form-item-explain-error');

    if (!errorContainer) {
      return null;
    }

    return errorContainer?.children[0];
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    spyCommands = jasmine.createSpyObj('CommandsService', ['setMarketCommand']);

    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        getTranslocoModule({
          langs: {
            'command/ru': ruCommand,
          }
        }),
        BrowserAnimationsModule
      ],
      declarations: [
        MarketCommandComponent,
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        }),
      ],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(quoteMock),
            unsubscribe: jasmine.createSpy('unsubscribe').and.callThrough()
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrumentBoards: jasmine.createSpy('getInstrumentBoards').and.returnValue(new Subject())
          }
        },
        ...commonTestProviders
      ]
    })
    .compileComponents();
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

  it('should initialize input values from context', async () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const formInputs = getFormInputs();

      expect(formInputs.quantity.value).toEqual(commandContext.commandParameters.quantity.toString());
    });
  });

  it('should show form errors', async () => {
    component.commandContext = getDefaultCommandContext();
    fixture.detectChanges();

    const cases: { control: string, setValue: () => any, expectedError?: string }[] = [
      {
        control: 'quantity',
        setValue: () => null,
        expectedError: 'Введите кол-во'
      },
      {
        control: 'quantity',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      }
    ];

    const inputs = getFormInputs();

    for (let testCase of cases) {
      const control: HTMLInputElement = (<any>inputs)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const errorElement = getValidationErrorElement(control);

        expect(errorElement).not.toBeNull();

        if (testCase.expectedError) {
          expect(errorElement?.textContent).toEqual(testCase.expectedError);
        }
      });
    }
  });

  it('should set null command when form invalid', () => {
      component.commandContext = getDefaultCommandContext();
      fixture.detectChanges();

      component.form.controls.quantity.setValue(null);
      fixture.detectChanges();

      expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', async  () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedCommand: MarketCommand = {
          quantity: Number(inputs.quantity.value),
          instrument: {
            ...commandContext.commandParameters.instrument,
            instrumentGroup: inputs.instrumentGroup
          },
          user: commandContext.commandParameters.user
        };

        expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(expectedCommand);
      });
    }
  );

  it('should set new command when form updated', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();
      const inputs = getFormInputs();

      const expectedCommand: MarketCommand = {
        quantity: 125,
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: 'SPBX'
        },
        user: commandContext.commandParameters.user
      };

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should update quantity', () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    const inputs = getFormInputs();
    const expectedCommand: MarketCommand = {
      quantity: 353,
      instrument: {
        ...commandContext.commandParameters.instrument,
        instrumentGroup: inputs.instrumentGroup
      },
      user: commandContext.commandParameters.user
    };

    component.quantity = {quantity: expectedCommand.quantity};
    fixture.detectChanges();

    expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(expectedCommand);
    expect(inputs.quantity.value).toEqual(expectedCommand.quantity.toString());
  });

  it('should update evaluation', (done) => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      component.activated = true;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedEvaluation: EvaluationBaseProperties = {
        price: expectedPrice,
        lotQuantity: 245,
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup,
        },
        instrumentCurrency: commandContext.instrument.currency
      };

      inputs.quantity.value = expectedEvaluation.lotQuantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.evaluation$.subscribe(x => {
        done();
        expect(x).toEqual(expectedEvaluation);
      });
    }
  );

  it('should NOT update evaluation if not activated', () => {
      component.commandContext = getDefaultCommandContext();
      component.activated = false;
      fixture.detectChanges();

      let isUpdated = false;
      component.evaluation$.subscribe(() => {
        isUpdated = true;
      });

      const inputs = getFormInputs();

      inputs.quantity.value = '106';
      inputs.quantity.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      expect(isUpdated).toBeFalse();
    }
  );
});
