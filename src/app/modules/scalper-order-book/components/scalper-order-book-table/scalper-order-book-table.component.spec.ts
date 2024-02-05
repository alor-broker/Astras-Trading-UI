import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookTableComponent } from './scalper-order-book-table.component';
import { ScalperOrdersService } from '../../services/scalper-orders.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { ScalperCommandProcessorService } from '../../services/scalper-command-processor.service';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { getTranslocoModule } from '../../../../shared/utils/testing';

describe('ScalperOrderBookTableComponent', () => {
  let component: ScalperOrderBookTableComponent;
  let fixture: ComponentFixture<ScalperOrderBookTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports:[getTranslocoModule()],
      declarations: [ScalperOrderBookTableComponent],
      providers: [
        {
          provide: ScalperOrdersService,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.callThrough()
          }
        },
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
          provide: HotKeyCommandService,
          useValue: {
            commands$: new Subject()
          }
        }
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
      orderBookBody$: new Subject(),
      displayRange$: new Subject(),
      workingVolume$: new Subject(),
      scaleFactor$: new BehaviorSubject(1),
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
