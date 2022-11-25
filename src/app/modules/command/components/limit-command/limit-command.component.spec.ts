import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';
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
import { LimitCommand } from "../../models/limit-command.model";
import { EvaluationBaseProperties } from "../../models/evaluation-base-properties.model";

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  let spyCommands: any;
  const priceSelected$ = new Subject<number>();
  const quantitySelected$ = new Subject<number>();

  const getDefaultCommandContext: () => CommandContextModel<CommandParams> = () => {
    const instrument = TestData.instruments[0];
    return {
      instrument: instrument,
      commandParameters: {
        type: CommandType.Limit,
        instrument: instrument,
        price: 1000,
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
      price: fixture.nativeElement.querySelector('input[formcontrolname="price"]') as HTMLInputElement,
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
    spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand', 'priceSelected$', 'quantitySelected$']);
    spyCommands.priceSelected$ = priceSelected$;
    spyCommands.quantitySelected$ = quantitySelected$;

    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
        BrowserAnimationsModule
      ],
      declarations: [
        LimitCommandComponent,
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        })
      ],
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

  it('should initialize input values from context', () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    const formInputs = getFormInputs();

    expect(formInputs.quantity.value).toEqual(commandContext.commandParameters.quantity.toString());
    expect(formInputs.price.value).toEqual(commandContext.commandParameters.price!.toString());
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
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => -1,
        expectedError: 'Слишком мало'
      },
      {
        control: 'price',
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

      component.form.controls.price.setValue(null);
      fixture.detectChanges();

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedCommand: LimitCommand = {
        price: Number(inputs.price.value),
        quantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup.value
        },
        user: commandContext.commandParameters.user
      };

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should set new command when form updated', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();
      const inputs = getFormInputs();

      const expectedCommand: LimitCommand = {
        price: 999,
        quantity: 125,
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: 'CUSTOM_GROUP'
        },
        user: commandContext.commandParameters.user
      };

      inputs.price.value = expectedCommand.price.toString();
      inputs.price.dispatchEvent(new Event('input'));

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      inputs.instrumentGroup.value = expectedCommand.instrument.instrumentGroup!;
      inputs.instrumentGroup.dispatchEvent(new Event('input'));


      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should update price', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedCommand: LimitCommand = {
        price: 478,
        quantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup.value
        },
        user: commandContext.commandParameters.user
      };

      priceSelected$.next(expectedCommand.price);
      fixture.detectChanges();

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
      expect(inputs.price.value).toEqual(expectedCommand.price.toString());
    }
  );

  it('should update quantity', () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    const inputs = getFormInputs();
    const expectedCommand: LimitCommand = {
      price: Number(inputs.price.value),
      quantity: 432,
      instrument: {
        ...commandContext.commandParameters.instrument,
        instrumentGroup: inputs.instrumentGroup.value
      },
      user: commandContext.commandParameters.user
    };

    quantitySelected$.next(expectedCommand.quantity);
    fixture.detectChanges();

    expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
    expect(inputs.quantity.value).toEqual(expectedCommand.quantity.toString());
  });

  it('should update evaluation', (done) => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedEvaluation: EvaluationBaseProperties = {
        price: 956,
        lotQuantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup.value,
        },
        instrumentCurrency: commandContext.instrument.currency
      };

      inputs.price.value = expectedEvaluation.price.toString();
      inputs.price.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      component.evaluation$.subscribe(x => {
        done();
        expect(x).toEqual(expectedEvaluation);
      });
    }
  );
});
