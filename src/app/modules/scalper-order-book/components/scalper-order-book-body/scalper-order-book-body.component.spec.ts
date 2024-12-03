import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ScalperOrderBookBodyComponent } from './scalper-order-book-body.component';
import {
  BehaviorSubject,
  NEVER,
  Subject
} from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { LetDirective } from "@ngrx/component";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { SCALPER_ORDERBOOK_SHARED_CONTEXT } from "../scalper-order-book/scalper-order-book.component";
import { ScalperHotKeyCommandService } from "../../services/scalper-hot-key-command.service";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { MockProvider } from "ng-mocks";
import { ScalperOrderBookSettingsWriteService } from "../../services/scalper-order-book-settings-write.service";
import { QuotesService } from "../../../../shared/services/quotes.service";
import { PortfolioSubscriptionsService } from "../../../../shared/services/portfolio-subscriptions.service";
import { AllTradesService } from "../../../../shared/services/all-trades.service";
import { ScalperOrderBookDataProvider } from "../../services/scalper-order-book-data-provider.service";

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
        ComponentHelpers.mockComponent({ selector: 'ats-trades-panel' }),
        ComponentHelpers.mockComponent({ selector: 'ats-scalper-order-book-table' }),
        ComponentHelpers.mockComponent({ selector: 'ats-orders-indicator', inputs: ['visible'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-possible-actions-panel' }),
        ComponentHelpers.mockComponent({ selector: 'ats-panels-container', inputs: ['initialWidths'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-panel', inputs: ['canResize', 'minWidthPx', 'defaultWidthPercent', 'expandable']}),
        ComponentHelpers.mockComponent({ selector: 'ats-top-floating-panel', inputs: ['guid', 'isActive']}),
        ComponentHelpers.mockComponent({ selector: 'ats-bottom-floating-panel', inputs: ['guid', 'isActive', 'dataContext']}),
        ComponentHelpers.mockComponent({ selector: 'ats-top-panel', inputs: ['guid', 'isActive', 'dataContext']}),
        ComponentHelpers.mockComponent({ selector: 'ats-limit-orders-volume-indicator', inputs: ['dataContext', 'side']}),
        ComponentHelpers.mockDirective({selector: '[cdkDrag]', inputs: ['cdkDragBoundary', 'cdkDragFreeDragPosition']}),
        ...ngZorroMockComponents
      ],
      providers: [
        MockProvider(
          ScalperOrderBookDataProvider,
          {
            getSettingsStream: () => NEVER,
            getOrderBookPortfolio: () => NEVER,
            getOrderBookPositionStream: () => NEVER,
            getOrderBookStream: () => NEVER
          }
        ),
        MockProvider(
          QuotesService,
          {
            getLastPrice: () => NEVER
          }
        ),
        MockProvider(
          PortfolioSubscriptionsService,
          {
            getOrdersSubscription: () => NEVER,
            getStopOrdersSubscription: () => NEVER,
            getTradesSubscription: () => NEVER
          }
        ),
        MockProvider(
          AllTradesService,
          {
            getNewTradesSubscription: () => NEVER,
          }
        ),
        MockProvider(
          ScalperHotKeyCommandService,
          {
            commands$: new Subject()
          }
        ),
        MockProvider(
          WidgetLocalStateService,
          {
            getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
            setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
          }
        ),
        MockProvider(
          SCALPER_ORDERBOOK_SHARED_CONTEXT,
          {
            workingVolume$: new Subject(),
            gridSettings$: new BehaviorSubject({
              rowHeight: 18,
              fontSize: 12
            }),
            scaleFactor$: new Subject()
          },
          'useValue'
        ),
        MockProvider(ScalperOrderBookSettingsWriteService)
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
