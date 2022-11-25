import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { CommandContextModel } from "../../models/command-context.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import {
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from "../../../../shared/utils/testing";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EvaluationBaseProperties } from "../../models/evaluation-base-properties.model";
import { MarketCommandComponent } from "./market-command.component";
import { MarketCommand } from "../../models/market-command.model";
import { Quote } from "../../../../shared/models/quotes/quote.model";
import { BehaviorSubject, Subject } from "rxjs";
import { QuotesService } from "../../../../shared/services/quotes.service";

describe('MarketCommandComponent', () => {
  let component: MarketCommandComponent;
  let fixture: ComponentFixture<MarketCommandComponent>;

  let spyCommands: any;
  const quantitySelected$ = new Subject<number>();


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
      quantity: fixture.nativeElement.querySelector('input[formcontrolname="quantity"]') as HTMLInputElement,
      instrumentGroup: fixture.nativeElement.querySelector('input[formcontrolname="instrumentGroup"]') as HTMLInputElement,
    };
  };

  const getValidationErrorElement = (element: HTMLElement) => {
    const inputContainer = element.parentElement?.parentElement?.parentElement?.parentElement;
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
    spyCommands = jasmine.createSpyObj('CommandsService', ['setMarketCommand', 'quantitySelected$']);
    spyCommands.quantitySelected$ = quantitySelected$;

    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        BrowserAnimationsModule
      ],
      declarations: [
        MarketCommandComponent,
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        })
      ],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(quoteMock),
            unsubscribe: jasmine.createSpy('unsubscribe').and.callThrough()
          }
        }
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

  it('should initialize input values from context', () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    const formInputs = getFormInputs();

    expect(formInputs.quantity.value).toEqual(commandContext.commandParameters.quantity.toString());
    expect(formInputs.instrumentGroup.value).toEqual(commandContext.commandParameters.instrument.instrumentGroup!.toString());
  });

  it('should show form errors', () => {
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
        setValue: () => -1,
        expectedError: 'Слишком мало'
      },
      {
        control: 'quantity',
        setValue: () => 1000000001,
        expectedError: 'Слишком много'
      }
    ];

    const inputs = getFormInputs();

    cases.forEach(testCase => {
      const control: HTMLInputElement = (<any>inputs)[testCase.control];
      control.value = testCase.setValue();
      control.dispatchEvent(new Event('input'));

      fixture.detectChanges();
      const errorElement = getValidationErrorElement(control);

      expect(errorElement).not.toBeNull();

      if (testCase.expectedError) {
        expect(errorElement?.textContent).toEqual(testCase.expectedError);
      }
    });
  });

  it('should set null command when form invalid', () => {
      component.commandContext = getDefaultCommandContext();
      fixture.detectChanges();

      component.form.controls.quantity.setValue(null);
      fixture.detectChanges();

      expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedCommand: MarketCommand = {
        quantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup.value
        },
        user: commandContext.commandParameters.user
      };

      expect(spyCommands.setMarketCommand).toHaveBeenCalledWith(expectedCommand);
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
          instrumentGroup: 'CUSTOM_GROUP'
        },
        user: commandContext.commandParameters.user
      };

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      inputs.instrumentGroup.value = expectedCommand.instrument.instrumentGroup!;
      inputs.instrumentGroup.dispatchEvent(new Event('input'));


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
        instrumentGroup: inputs.instrumentGroup.value
      },
      user: commandContext.commandParameters.user
    };

    quantitySelected$.next(expectedCommand.quantity);
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
          instrumentGroup: inputs.instrumentGroup.value,
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
