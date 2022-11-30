import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StopEditComponent } from './stop-edit.component';
import { CommandsService } from "../../services/commands.service";
import { NZ_I18N, ru_RU } from "ng-zorro-antd/i18n";
import { TimezoneConverterService } from "../../../../shared/services/timezone-converter.service";
import { of, Subject } from "rxjs";
import { TimezoneConverter } from "../../../../shared/utils/timezone-converter";
import { TimezoneDisplayOption } from "../../../../shared/models/enums/timezone-display-option";
import { Side } from "../../../../shared/models/enums/side.model";
import { PortfolioKey } from "../../../../shared/models/portfolio-key.model";
import { sharedModuleImportForTests, TestData } from "../../../../shared/utils/testing";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { StopEdit } from "../../models/stop-edit";
import { StopOrderCondition } from '../../../../shared/models/enums/stoporder-conditions';

describe('StopEditComponent', () => {
  let component: StopEditComponent;
  let fixture: ComponentFixture<StopEditComponent>;

  const timezoneConverter = new TimezoneConverter(TimezoneDisplayOption.MskTime);
  const commandsServiceSpy = {
    setStopEdit: jasmine.createSpy('setStopEdit').and.callThrough(),
    quantitySelected$: new Subject()
  };

  const initialCommandContext = {
    instrument: TestData.instruments[0],
    commandParameters: {
      orderId: '123',
      side: Side.Sell,
      type: 'stoplimit',
      instrument: TestData.instruments[0],
      price: 1000,
      triggerPrice: 1000,
      quantity: 15,
      stopEndUnixTime: new Date(),
      condition: StopOrderCondition.More,
      user: {
        portfolio: 'D1234'
      } as PortfolioKey
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        StopEditComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        ...sharedModuleImportForTests
      ],
      providers: [
        {provide: NZ_I18N, useValue: ru_RU},
        {provide: CommandsService, useValue: commandsServiceSpy},
        {
          provide: TimezoneConverterService,
          useValue: {
            getConverter: jasmine.createSpy('getConverter').and.returnValue(of(timezoneConverter))
          }
        },
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StopEditComponent);
    component = fixture.componentInstance;
    component.commandContext = initialCommandContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize input values from context', () => {
    const formValue = component.form.getRawValue();
    expect(formValue.quantity).toBe(initialCommandContext.commandParameters.quantity);
    expect(formValue.price).toBe(initialCommandContext.commandParameters.price!);
    expect(formValue.triggerPrice).toBe(initialCommandContext.commandParameters.triggerPrice!);
    expect(formValue.stopEndUnixTime).toEqual(initialCommandContext.commandParameters.stopEndUnixTime);
    expect(formValue.condition).toBe(initialCommandContext.commandParameters.condition!);
    expect(formValue.withLimit).toBe(true);
    expect(formValue.side).toBe(initialCommandContext.commandParameters.side!);
  });

  it('should set null command when form invalid', () => {
      fixture.detectChanges();

      component.form.controls.price?.setValue(null);
      fixture.detectChanges();

      expect(commandsServiceSpy.setStopEdit).toHaveBeenCalledWith(null);
    }
  );


  it('should set command with default values', () => {
      fixture.detectChanges();

      const expectedCommand: StopEdit = {
        id: initialCommandContext.commandParameters.orderId,
        price: Number(initialCommandContext.commandParameters.price),
        quantity: Number(initialCommandContext.commandParameters.quantity),
        triggerPrice: Number(initialCommandContext.commandParameters.triggerPrice),
        condition: initialCommandContext.commandParameters.condition,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(initialCommandContext.commandParameters.stopEndUnixTime).getTime() / 1000,
        instrument: {
          ...initialCommandContext.commandParameters.instrument,
        },
        user: initialCommandContext.commandParameters.user,
        side: initialCommandContext.commandParameters.side
      };

      expect(commandsServiceSpy.setStopEdit).toHaveBeenCalledWith(expectedCommand);
    }
  );

  it('should set new command when form updated', () => {
      const stopEndDate = new Date();
      const expectedCommand: StopEdit = {
        id: '123',
        instrument: initialCommandContext.commandParameters.instrument,
        user: initialCommandContext.commandParameters.user,
        price: 999,
        quantity: 125,
        triggerPrice: 110,
        stopEndUnixTime: timezoneConverter.terminalToUtc0Date(stopEndDate).getTime() / 1000,
        condition: StopOrderCondition.Less,
        side: initialCommandContext.commandParameters.side
      };

      component.form.controls.price?.setValue(999);
      component.form.controls.quantity?.setValue(125);
      component.form.controls.triggerPrice?.setValue(110);
      component.form.controls.stopEndUnixTime?.setValue(stopEndDate);
      component.form.controls.condition?.setValue(StopOrderCondition.Less);
      component.form.controls.side?.setValue(Side.Buy);

      fixture.detectChanges();

      expect(commandsServiceSpy.setStopEdit).toHaveBeenCalledWith(expectedCommand);
    }
  );
});
