import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { CommandContextModel } from "../../models/command-context.model";
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
import { LimitEditComponent } from "./limit-edit.component";
import { EditParams } from "../../../../shared/models/commands/edit-params.model";
import { Side } from "../../../../shared/models/enums/side.model";
import { LimitEdit } from "../../models/limit-edit.model";
import { Subject } from "rxjs";
import ruCommand from '../../../../../assets/i18n/command/ru.json';
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';

describe('LimitEditComponent', () => {
  let component: LimitEditComponent;
  let fixture: ComponentFixture<LimitEditComponent>;

  let spyCommands: any;

  const getDefaultCommandContext: () => CommandContextModel<EditParams> = () => {
    const instrument = TestData.instruments[0];
    return {
      instrument: instrument,
      commandParameters: {
        orderId: '123',
        side: Side.Sell,
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
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]').querySelector('input') as HTMLInputElement
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
    spyCommands = {
      setLimitEdit: jasmine.createSpy('setLimitEdit').and.callThrough(),
      quantitySelected$: new Subject()
    };

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
        LimitEditComponent,
        mockComponent({
          selector: 'ats-evaluation',
          inputs: ['evaluationProperties']
        })
      ],
      providers: [
        { provide: CommandsService, useValue: spyCommands },
        ...commonTestProviders
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitEditComponent);
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

      expect(spyCommands.setLimitEdit).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', async () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedCommand: LimitEdit = {
          id: commandContext.commandParameters.orderId,
          price: Number(inputs.price.value),
          quantity: Number(inputs.quantity.value),
          instrument: {
            ...commandContext.commandParameters.instrument,
          },
          user: commandContext.commandParameters.user
        };

        expect(spyCommands.setLimitEdit).toHaveBeenCalledWith(expectedCommand);
      });
    }
  );

  it('should set new command when form updated', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();
      const inputs = getFormInputs();

      const expectedCommand: LimitEdit = {
        id: commandContext.commandParameters.orderId,
        price: 999,
        quantity: 125,
        instrument: {
          ...commandContext.commandParameters.instrument
        },
        user: commandContext.commandParameters.user
      };

      inputs.price.value = expectedCommand.price.toString();
      inputs.price.dispatchEvent(new Event('input'));

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      expect(spyCommands.setLimitEdit).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should update evaluation', async() => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const inputs = getFormInputs();
        const expectedEvaluation: EvaluationBaseProperties = {
          price: 956,
          lotQuantity: Number(inputs.quantity.value),
          instrument: {
            ...commandContext.commandParameters.instrument
          },
          instrumentCurrency: commandContext.instrument.currency
        };

        inputs.price.value = expectedEvaluation.price.toString();
        inputs.price.dispatchEvent(new Event('input'));
        fixture.detectChanges();

        component.evaluation$.subscribe(x => {
          expect(x).toEqual(expectedEvaluation);
        });
      });
    }
  );
});
