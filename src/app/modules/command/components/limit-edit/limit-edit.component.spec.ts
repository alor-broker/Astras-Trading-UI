import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { CommandsService } from '../../services/commands.service';

import { CommandContextModel } from "../../models/command-context.model";
import {
  mockComponent,
  sharedModuleImportForTests,
  TestData
} from "../../../../shared/utils/testing";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { EvaluationBaseProperties } from "../../models/evaluation-base-properties.model";
import { LimitEditComponent } from "./limit-edit.component";
import { EditParams } from "../../../../shared/models/commands/edit-params.model";
import { Side } from "../../../../shared/models/enums/side.model";
import { LimitEdit } from "../../models/limit-edit.model";

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
      quantity: fixture.nativeElement.querySelector('input[formcontrolname="quantity"]') as HTMLInputElement,
      price: fixture.nativeElement.querySelector('input[formcontrolname="price"]') as HTMLInputElement
    };
  };

  const getValidationErrorElement = (element: HTMLElement) => {
    const inputContainer = element.parentElement?.parentElement?.parentElement;
    if (!inputContainer) {
      return null;
    }

    const errorContainer = inputContainer.querySelector('.ant-form-item-explain-error');

    if (!errorContainer) {
      return null;
    }

    return errorContainer;
  };

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    spyCommands = jasmine.createSpyObj('CommandsService', ['setLimitEdit']);

    await TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests,
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
        { provide: CommandsService, useValue: spyCommands }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitEditComponent);
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
        expectedError: 'Введите кол-во'
      },
      {
        control: 'quantity',
        setValue: () => 1000000001,
        expectedError: 'Введите кол-во'
      },
      {
        control: 'price',
        setValue: () => null,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => -1,
        expectedError: 'Введите цену'
      },
      {
        control: 'price',
        setValue: () => 1000000001,
        expectedError: 'Введите цену'
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

      expect(spyCommands.setLimitEdit).toHaveBeenCalledWith(null);
    }
  );

  it('should set command with default values', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

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

  it('should update evaluation', (done) => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();

      const inputs = getFormInputs();
      const expectedEvaluation: EvaluationBaseProperties = {
        price: 956,
        lotQuantity: Number(inputs.quantity.value),
        instrument: {
          ...commandContext.commandParameters.instrument
        }
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
