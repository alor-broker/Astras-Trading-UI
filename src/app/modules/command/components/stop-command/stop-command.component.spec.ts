import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import {
  of,
  Subject
} from 'rxjs';
import { CommandsService } from '../../services/commands.service';

import { CommandContextModel } from "../../models/command-context.model";
import { CommandParams } from "../../../../shared/models/commands/command-params.model";
import {
  commonTestProviders,
  getTranslocoModule,
  sharedModuleImportForTests,
  TestData
} from "../../../../shared/utils/testing";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { StopCommandComponent } from "./stop-command.component";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import {
  addMonthsUnix,
  getUtcNow
} from "../../../../shared/utils/datetime";
import { StopCommand } from "../../models/stop-command.model";
import {
  NZ_I18N,
  ru_RU
} from "ng-zorro-antd/i18n";
import ruCommand from "../../../../../assets/i18n/command/ru.json";
import {LessMore} from "../../../../shared/models/enums/less-more.model";
import { StopFormData } from "../../models/stop-form-data.model";

describe('StopCommandComponent', () => {
  let component: StopCommandComponent;
  let fixture: ComponentFixture<StopCommandComponent>;

  let spyCommands: any;

  let timezoneConverterServiceSpy: any;
  const commandError$ = new Subject<boolean | null>();
  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);

  const getDefaultCommandContext: () => CommandContextModel<CommandParams> = () => {
    const instrument = TestData.instruments[0];
    return {
      instrument: instrument,
      commandParameters: {
        type: CommandType.Stop,
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
      triggerPrice: fixture.nativeElement.querySelector('[formcontrolname="triggerPrice"]').querySelector('input') as HTMLInputElement,
      condition: fixture.nativeElement.querySelector('nz-select[formcontrolname="condition"]') as HTMLSelectElement,
      price: fixture.nativeElement.querySelector('[formcontrolname="price"]')?.querySelector('input') as HTMLInputElement
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
    spyCommands = jasmine.createSpyObj('CommandsService', ['setStopCommand', 'commandError$']);
    spyCommands.commandError$ = commandError$;

    timezoneConverterServiceSpy = jasmine.createSpyObj('TimezoneConverterService', ['getConverter']);
    timezoneConverterServiceSpy.getConverter.and.returnValue(of(timezoneConverter));

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
      declarations: [StopCommandComponent],
      providers: [
        { provide: NZ_I18N, useValue: ru_RU },
        { provide: CommandsService, useValue: spyCommands },
        { provide: TimezoneConverterService, useValue: timezoneConverterServiceSpy },
        ...commonTestProviders
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopCommandComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize input values from context', async () => {
    try {
      jasmine.clock().install();
    } catch {}
    const nowDateMock = Date.now();
    jasmine.clock().mockDate(new Date(nowDateMock));

    const commandContext = getDefaultCommandContext();
    component.commandContext = commandContext;
    fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const formInputs = getFormInputs();
      const expectedDate = timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1));

      jasmine.clock().uninstall();

      expect(formInputs.quantity.value).toEqual(commandContext.commandParameters.quantity.toString());
      expect(formInputs.condition.innerText).toEqual('Больше');

      // stopEndUnixTime is complex control. Value is not accessible
      expect(component.form.controls.stopEndUnixTime?.value).toEqual(expectedDate);
      // withLimit is not input control. Value is not accessible
      expect(component.form.controls.withLimit.value).toEqual(false);
    });
  });

  it('should show form errors', async () => {
    component.commandContext = getDefaultCommandContext();
    fixture.detectChanges();

    component.form.controls.withLimit.setValue(true);
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
        control: 'triggerPrice',
        setValue: () => null,
        expectedError: 'Введите цену'
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

      component.form!.controls[testCase.control as keyof StopFormData]!.markAsDirty();
      component.form!.controls[testCase.control as keyof StopFormData]!.updateValueAndValidity({ onlySelf: false });

      fixture.detectChanges();

      await fixture.whenStable().then(() => {
        const errorElement = getValidationErrorElement(control);

        expect(errorElement).not.toBeNull();

        if (testCase.expectedError) {
          expect(errorElement?.textContent)
            .withContext(testCase.control)
            .toEqual(testCase.expectedError);
        }
      });
    }
  });

  it('should set null command when form invalid', () => {
      component.commandContext = getDefaultCommandContext();
      fixture.detectChanges();

      component.form.controls.quantity.setValue(null);
      fixture.detectChanges();

      expect(spyCommands.setStopCommand).toHaveBeenCalledWith(null);
    }
  );

  it('should set new command when form updated', () => {
      const commandContext = getDefaultCommandContext();
      component.commandContext = commandContext;
      fixture.detectChanges();
      const expectedDate = timezoneConverter.toTerminalUtcDate(addMonthsUnix(getUtcNow(), 1));

      const expectedCommand: StopCommand = {
        quantity: 125,
        triggerPrice: 126,
        condition: LessMore.Less,
        price: 140,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(expectedDate),
        instrument: {
          ...commandContext.commandParameters.instrument
        },
        user: commandContext.commandParameters.user
      } as StopCommand;

      component.form.controls.stopEndUnixTime?.setValue(expectedDate);
      component.form.controls.withLimit.setValue(true);
      fixture.detectChanges();

      const inputs = getFormInputs();

      inputs.quantity.value = expectedCommand.quantity.toString();
      inputs.quantity.dispatchEvent(new Event('input'));

      inputs.triggerPrice.value = expectedCommand.triggerPrice.toString();
      inputs.triggerPrice.dispatchEvent(new Event('input'));

      // used third party control. Value cannot be changed directly
      component.form.controls.condition.setValue(expectedCommand.condition);
      fixture.detectChanges();

      inputs.price.value = expectedCommand.price!.toString();
      inputs.price.dispatchEvent(new Event('input'));

      expect(spyCommands.setStopCommand).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should show form errors on command error', () => {
    component.commandContext = getDefaultCommandContext();
    fixture.detectChanges();

    component.form.controls.withLimit.setValue(true);
    fixture.detectChanges();

    const inputs = getFormInputs();
    inputs.price.value = '';
    inputs.price.dispatchEvent(new Event('input'));

    commandError$.next(true);
    fixture.detectChanges();

    const errorElement = getValidationErrorElement(inputs.price);

    expect(errorElement?.textContent).toEqual('Введите цену');
  });

  it('should update price',async () => {
    const commandContext = getDefaultCommandContext();
    const stopEndUnixTimeVal = new Date((new Date).setMonth((new Date()).getMonth() + 1));
    component.commandContext = commandContext;

    component.form.controls.withLimit.setValue(true);
    component.form.controls.triggerPrice.setValue(1);
    component.form.controls.stopEndUnixTime!.setValue(stopEndUnixTimeVal);
    fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const inputs = getFormInputs();
      const expectedCommand: StopCommand = {
        price: 308,
        quantity: Number(inputs.quantity.value),
        triggerPrice: Number(inputs.triggerPrice.value),
        instrument: {
          ...commandContext.commandParameters.instrument,
        },
          condition: LessMore.More,
        user: commandContext.commandParameters.user,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(stopEndUnixTimeVal)
      } as StopCommand;

    component.price = { price: expectedCommand.price!};
    fixture.detectChanges();

      expect(spyCommands.setStopCommand).toHaveBeenCalledWith(expectedCommand);
      expect(inputs.price.value).toEqual(expectedCommand.price!.toString());
    });
  });

  it('should update quantity', async () => {
    const commandContext = getDefaultCommandContext();
    const stopEndUnixTimeVal = new Date((new Date).setMonth((new Date()).getMonth() + 1));
    component.commandContext = commandContext;

    component.form.controls.withLimit.setValue(true);
    component.form.controls.triggerPrice.setValue(1);
    component.form.controls.price!.setValue(commandContext.commandParameters.price);
    component.form.controls.stopEndUnixTime!.setValue(stopEndUnixTimeVal);
    fixture.detectChanges();

    await fixture.whenStable().then(() => {
      const inputs = getFormInputs();
      const expectedCommand: StopCommand = {
        price: Number(inputs.price.value),
        triggerPrice: Number(inputs.triggerPrice.value),
        quantity: 499,
        instrument: {
          ...commandContext.commandParameters.instrument,
        },
          condition: LessMore.More,
        user: commandContext.commandParameters.user,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(stopEndUnixTimeVal)
      } as StopCommand;

    component.quantity = {quantity: expectedCommand.quantity!};
    fixture.detectChanges();

      expect(spyCommands.setStopCommand).toHaveBeenCalledWith(expectedCommand);
      expect(inputs.quantity.value).toEqual(expectedCommand.quantity.toString());
    });
  });
});
