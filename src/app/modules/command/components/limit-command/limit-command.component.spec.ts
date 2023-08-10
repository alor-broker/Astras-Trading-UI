import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { LimitCommandComponent } from './limit-command.component';
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
import { LimitCommand } from "../../models/limit-command.model";
import ruCommand from '../../../../../assets/i18n/command/ru.json';
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {Subject} from "rxjs";

describe('LimitCommandComponent', () => {
  let component: LimitCommandComponent;
  let fixture: ComponentFixture<LimitCommandComponent>;

  let spyCommands: any;

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
      quantity: fixture.nativeElement.querySelector('[formcontrolname="quantity"]').querySelector('input') as HTMLInputElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]').querySelector('input') as HTMLInputElement,
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
    spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitCommand']);

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
        LimitCommandComponent,
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        })
      ],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
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
    fixture = TestBed.createComponent(LimitCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

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
      expect(formInputs.price.value).toEqual(commandContext.commandParameters.price!.toString());
    });
  });

  it('should show form errors',  async () => {
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
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
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

      component.form.controls.price.setValue(null);
      fixture.detectChanges();

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', async () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const inputs = getFormInputs();
      const expectedCommand: LimitCommand = {
        price: Number(inputs.price.value),
        quantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup
        },
        user: commandContext.commandParameters.user
      };

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
    });
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
          instrumentGroup: 'SPBX'
        },
        user: commandContext.commandParameters.user
      };

      inputs.price.value = expectedCommand.price.toString();
      inputs.price.dispatchEvent(new Event('input'));

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should update price', async () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedCommand: LimitCommand = {
          price: 478,
          quantity: Number(inputs.quantity.value),
          instrument: {
            ...commandContext.commandParameters.instrument,
            instrumentGroup: inputs.instrumentGroup
          },
          user: commandContext.commandParameters.user
        };

        component.price = { price: expectedCommand.price };

        fixture.detectChanges();
        expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
        expect(inputs.price.value).toEqual(expectedCommand.price.toString());
      });
    }
  );

  it('should update quantity', async () => {
    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const inputs = getFormInputs();
      const expectedCommand: LimitCommand = {
        price: Number(inputs.price.value),
        quantity: 432,
        instrument: {
          ...commandContext.commandParameters.instrument,
          instrumentGroup: inputs.instrumentGroup
        },
        user: commandContext.commandParameters.user
      };

    component.quantity = { quantity: expectedCommand.quantity};
    fixture.detectChanges();

      expect(spyCommands.setLimitCommand).toHaveBeenCalledWith(expectedCommand);
      expect(inputs.quantity.value).toEqual(expectedCommand.quantity.toString());
    });
  });

  it('should update evaluation', async () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedEvaluation: EvaluationBaseProperties = {
          price: 956,
          lotQuantity: Number(inputs.quantity.value),
          instrument: {
            ...commandContext.commandParameters.instrument,
            instrumentGroup: inputs.instrumentGroup,
          },
          instrumentCurrency: commandContext.instrument.currency
        };

        inputs.price.value = expectedEvaluation.price.toString();
        inputs.price.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        component.evaluation$?.subscribe(x => {
          expect(x).toEqual(expectedEvaluation);
        });
      });
    }
  );
});
