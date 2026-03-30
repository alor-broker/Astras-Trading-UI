import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperOrderBookTableComponent} from './scalper-order-book-table.component';
import {ThemeService} from '../../../../shared/services/theme.service';
import {BehaviorSubject, EMPTY, Subject} from 'rxjs';
import {ScalperCommandProcessorService} from '../../services/scalper-command-processor.service';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';
import {CancelOrdersCommand} from "../../commands/cancel-orders-command";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {RULER_CONTEX} from "../scalper-order-book-body/scalper-order-book-body.component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {TableRulerComponent} from "../table-ruler/table-ruler.component";
import {HoverItemsGroupDirective} from "../../directives/hover-items-group.directive";
import {HoverItemDirective} from "../../directives/hover-item.directive";
import {ShortNumberComponent} from "../../../../shared/components/short-number/short-number.component";
import {LetDirective} from "@ngrx/component";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

describe('ScalperOrderBookTableComponent', () => {
  let component: ScalperOrderBookTableComponent;
  let fixture: ComponentFixture<ScalperOrderBookTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        ScalperOrderBookTableComponent,
        LetDirective,
        MockComponents(
          TableRulerComponent,
          ShortNumberComponent,
        ),
        MockDirectives(
          HoverItemsGroupDirective,
          HoverItemDirective,
          NzTooltipDirective
        )
      ],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: ScalperCommandProcessorService,
          useValue: jasmine.createSpyObj(ScalperCommandProcessorService, [
            'processLeftMouseClick',
            'processRightMouseClick',
            'processHotkeyPress'
          ])
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
    fixture.componentRef.setInput(
      'dataContext',
      {
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
        addLocalOrder: () => {
        },
        removeLocalOrder: () => {
        },
        destroy: () => {
        }
      } as ScalperOrderBookDataContext
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
