import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookBodyComponent } from './scalper-order-book-body.component';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import {
  mockComponent,
  mockDirective,
  ngZorroMockComponents
} from '../../../../shared/utils/testing';
import { HotKeyCommandService } from '../../../../shared/services/hot-key-command.service';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { LetDirective } from "@ngrx/component";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { SCALPER_ORDERBOOK_SHARED_CONTEXT } from "../scalper-order-book/scalper-order-book.component";

describe('ScalperOrderBookBodyComponent', () => {
  let component: ScalperOrderBookBodyComponent;
  let fixture: ComponentFixture<ScalperOrderBookBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ScrollingModule,
        LetDirective
      ],
      declarations: [
        ScalperOrderBookBodyComponent,
        mockComponent({ selector: 'ats-trades-panel' }),
        mockComponent({ selector: 'ats-scalper-order-book-table' }),
        mockComponent({ selector: 'ats-orders-indicator', inputs: ['visible'] }),
        mockComponent({ selector: 'ats-possible-actions-panel' }),
        mockComponent({ selector: 'ats-panels-container', inputs: ['initialWidths'] }),
        mockComponent({ selector: 'ats-panel', inputs: ['canResize', 'minWidthPx', 'defaultWidthPercent', 'expandable']}),
        mockComponent({ selector: 'ats-top-floating-panel', inputs: ['guid', 'isActive']}),
        mockComponent({ selector: 'ats-bottom-floating-panel', inputs: ['guid', 'isActive', 'dataContext']}),
        mockComponent({ selector: 'ats-limit-orders-volume-indicator', inputs: ['dataContext', 'side']}),
        mockDirective({selector: '[cdkDrag]', inputs: ['cdkDragBoundary', 'cdkDragFreeDragPosition']}),
        ...ngZorroMockComponents
      ],
      providers: [
        {
          provide: ScalperOrderBookDataContextService,
          useValue: {
            createContext: jasmine.createSpy('createContext').and.returnValue({
              extendedSettings$: new Subject(),
              orderBook$: new Subject(),
              position$: new Subject(),
              currentOrders$: new Subject(),
              currentPortfolio$: new Subject(),
              trades$: new Subject(),
              orderBookBody$: new Subject(),
              displayRange$: new Subject(),
              workingVolume$: new Subject(),
              scaleFactor$: new BehaviorSubject(1)
            } as ScalperOrderBookDataContext),
            getOrderBookBounds: jasmine.createSpy('getOrderBookBounds').and.returnValue({
              asksRange: null,
              bidsRange: null
            })
          }
        },
        {
          provide: HotKeyCommandService,
          useValue: {
            commands$: new Subject()
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough(),
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: WidgetLocalStateService,
          useValue: {
            getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        },
        {
          provide: SCALPER_ORDERBOOK_SHARED_CONTEXT,
          useValue: {
            workingVolume$: new Subject(),
            gridSettings$: new BehaviorSubject({
              rowHeight: 18,
              fontSize: 12
            })
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookBodyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
