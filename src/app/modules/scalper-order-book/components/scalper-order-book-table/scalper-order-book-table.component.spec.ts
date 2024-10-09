import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookTableComponent } from './scalper-order-book-table.component';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  BehaviorSubject,
  EMPTY,
  Subject
} from 'rxjs';
import { ScalperCommandProcessorService } from '../../services/scalper-command-processor.service';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { getTranslocoModule } from '../../../../shared/utils/testing';
import { CancelOrdersCommand } from "../../commands/cancel-orders-command";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import { RULER_CONTEX } from "../scalper-order-book-body/scalper-order-book-body.component";

describe('ScalperOrderBookTableComponent', () => {
  let component: ScalperOrderBookTableComponent;
  let fixture: ComponentFixture<ScalperOrderBookTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[getTranslocoModule()],
      declarations: [ScalperOrderBookTableComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ScalperCommandProcessorService,
          useValue: jasmine.createSpyObj(
            ScalperCommandProcessorService,
            [
              'processLeftMouseClick',
              'processRightMouseClick',
              'processHotkeyPress'
            ]
          )
        },
        {
          provide: ScalperHotKeyCommandService,
          useValue: {
            commands$: new Subject()
          }
        },
        {
          provide: CancelOrdersCommand,
          useValue: {
            execute: jasmine.createSpy('execute').and.callThrough()
          }
        },
        {
          provide: RULER_CONTEX,
          useValue: {
            hoveredRow$: EMPTY,
            setHoveredRow: jasmine.createSpy('setHoveredRow').and.callThrough()
          }
        },
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookTableComponent);
    component = fixture.componentInstance;
    component.dataContext = {
      extendedSettings$: new Subject(),
      orderBook$: new Subject(),
      position$: new Subject(),
      currentOrders$: new Subject(),
      currentPortfolio$: new Subject(),
      trades$: new Subject(),
      ownTrades$: new Subject(),
      orderBookBody$: new Subject(),
      displayRange$: new Subject(),
      workingVolume$: new Subject(),
      scaleFactor$: new BehaviorSubject(1),
      addLocalOrder: () => {},
      removeLocalOrder: () => {},
      destroy: () => {}
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
