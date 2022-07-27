import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';
import { ModalService } from 'src/app/shared/services/modal.service';
import { CommandsService } from '../../services/commands.service';

import { CommandFooterComponent } from './command-footer.component';
import { CommandType } from "../../../../shared/models/enums/command-type.model";
import { Side } from "../../../../shared/models/enums/side.model";
import { SubmitOrderResult } from "../../models/order.model";
import {
  of,
  throwError
} from "rxjs";

describe('CommandFooterComponent', () => {
  let component: CommandFooterComponent;
  let fixture: ComponentFixture<CommandFooterComponent>;

  let commandSpy: any;
  let modalSpy: any;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    commandSpy = jasmine.createSpyObj('CommandsService', ['submitMarket', 'submitLimit', 'submitStop']);
    modalSpy = jasmine.createSpyObj('ModalService', ['closeCommandModal']);

    await TestBed.configureTestingModule({
      declarations: [CommandFooterComponent],
      providers: [
        { provide: CommandsService, useValue: commandSpy },
        { provide: ModalService, useValue: modalSpy },
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CommandFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call appropriate command', () => {
    const cases: {
      commandType: CommandType,
      setup: () => void,
      expect: () => void
    }[] = [
      {
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.calls.reset();
          component.sell();
        },
        expect: () => {
          expect(commandSpy.submitMarket)
          .withContext('Sell Market')
          .toHaveBeenCalledOnceWith(Side.Sell);
        }
      },
      {
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.calls.reset();
          component.buy();
        },
        expect: () => {
          expect(commandSpy.submitMarket)
          .withContext('Buy Market')
          .toHaveBeenCalledOnceWith(Side.Buy);
        }
      },
      {
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.calls.reset();
          component.sell();
        },
        expect: () => {
          expect(commandSpy.submitLimit)
          .withContext('Sell Limit')
          .toHaveBeenCalledOnceWith(Side.Sell);
        }
      },
      {
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.calls.reset();
          component.buy();
        },
        expect: () => {
          expect(commandSpy.submitLimit)
          .withContext('Buy Limit')
          .toHaveBeenCalledOnceWith(Side.Buy);
        }
      },
      {
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.calls.reset();
          component.sell();
        },
        expect: () => {
          expect(commandSpy.submitStop)
          .withContext('Sell Stop')
          .toHaveBeenCalledOnceWith(Side.Sell);
        }
      },
      {
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.calls.reset();
          component.buy();
        },
        expect: () => {
          expect(commandSpy.submitStop)
          .withContext('Buy Stop')
          .toHaveBeenCalledOnceWith(Side.Buy);
        }
      },
    ];

    cases.forEach(testCase => {
      component.activeCommandType = testCase.commandType;
      fixture.detectChanges();

      testCase.setup();
      testCase.expect();
    });
  });

  it('should close modal on command success', () => {
    const cases: {
      description: string,
      commandType: CommandType,
      setup: () => void
    }[] = [
      {
        description: 'Sell Market',
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.sell();
        }
      },
      {
        description: 'Buy Market',
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.buy();
        }
      },
      {
        description: 'Sell Limit',
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.sell();
        }
      },
      {
        description: 'Buy Limit',
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.buy();
        }
      },
      {
        description: 'Sell Stop',
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.sell();
        }
      },
      {
        description: 'Buy Stop',
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.and.returnValue(of({ orderNumber: '1' } as SubmitOrderResult));
          component.buy();
        }
      }
    ];

    cases.forEach(testCase => {
      component.activeCommandType = testCase.commandType;
      fixture.detectChanges();

      modalSpy.closeCommandModal.calls.reset();

      testCase.setup();

      expect(modalSpy.closeCommandModal)
      .withContext(testCase.description)
      .toHaveBeenCalledTimes(1);
    });
  });

  it('should NOT close modal on empty error', () => {
    const error =  throwError(() => new Error('Empty command'));

    const cases: {
      description: string,
      commandType: CommandType,
      setup: () => void
    }[] = [
      {
        description: 'Sell Market',
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.and.returnValue(error);
          component.sell();
        }
      },
      {
        description: 'Buy Market',
        commandType: CommandType.Market,
        setup: () => {
          commandSpy.submitMarket.and.returnValue(error);
          component.buy();
        }
      },
      {
        description: 'Sell Limit',
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.and.returnValue(error);
          component.sell();
        }
      },
      {
        description: 'Buy Limit',
        commandType: CommandType.Limit,
        setup: () => {
          commandSpy.submitLimit.and.returnValue(error);
          component.buy();
        }
      },
      {
        description: 'Sell Stop',
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.and.returnValue(error);
          component.sell();
        }
      },
      {
        description: 'Buy Stop',
        commandType: CommandType.Stop,
        setup: () => {
          commandSpy.submitStop.and.returnValue(error);
          component.buy();
        }
      }
    ];

    cases.forEach(testCase => {
      component.activeCommandType = testCase.commandType;
      fixture.detectChanges();

      modalSpy.closeCommandModal.calls.reset();

      testCase.setup();

      expect(modalSpy.closeCommandModal)
      .withContext(testCase.description)
      .toHaveBeenCalledTimes(0);
    });
  });
});
