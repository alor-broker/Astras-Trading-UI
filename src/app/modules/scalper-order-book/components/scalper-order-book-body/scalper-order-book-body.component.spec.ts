import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ScalperOrderBookBodyComponent} from './scalper-order-book-body.component';
import {BehaviorSubject, NEVER, Subject} from 'rxjs';
import {LetDirective} from "@ngrx/component";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from "../scalper-order-book/scalper-order-book.component";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {AllTradesService} from "../../../../shared/services/all-trades.service";
import {ScalperOrderBookDataProvider} from "../../services/scalper-order-book-data-provider.service";
import {TopPanelComponent} from "../top-panel/top-panel.component";
import {NzSpinComponent} from "ng-zorro-antd/spin";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {PanelsContainerComponent} from "../panels/panels-container/panels-container.component";
import {PanelComponent} from "../panels/panel/panel.component";
import {TradeClustersPanelComponent} from "../trade-clusters-panel/trade-clusters-panel.component";
import {TradesPanelComponent} from "../trades-panel/trades-panel.component";
import {ScalperOrderBookTableComponent} from "../scalper-order-book-table/scalper-order-book-table.component";
import {
  LimitOrdersVolumeIndicatorComponent
} from "../limit-orders-volume-indicator/limit-orders-volume-indicator.component";
import {OrdersIndicatorComponent} from "../orders-indicator/orders-indicator.component";
import {CdkDrag} from "@angular/cdk/drag-drop";
import {TopFloatingPanelComponent} from "../top-floating-panel/top-floating-panel.component";
import {BottomFloatingPanelComponent} from "../bottom-floating-panel/bottom-floating-panel.component";
import {PossibleActionsPanelComponent} from "../possible-actions-panel/possible-actions-panel.component";
import {NzEmptyComponent} from "ng-zorro-antd/empty";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('ScalperOrderBookBodyComponent', () => {
  let component: ScalperOrderBookBodyComponent;
  let fixture: ComponentFixture<ScalperOrderBookBodyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LetDirective,
        ScalperOrderBookBodyComponent,
        MockComponents(
          TopPanelComponent,
          NzSpinComponent,
          PanelsContainerComponent,
          PanelComponent,
          TradeClustersPanelComponent,
          TradesPanelComponent,
          ScalperOrderBookTableComponent,
          LimitOrdersVolumeIndicatorComponent,
          OrdersIndicatorComponent,
          TopFloatingPanelComponent,
          BottomFloatingPanelComponent,
          PossibleActionsPanelComponent,
          NzEmptyComponent,
        ),
        MockDirectives(
          NzResizeObserverDirective,
          CdkDrag,
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookDataProvider, {
          getSettingsStream: () => NEVER,
          getOrderBookPortfolio: () => NEVER,
          getOrderBookPositionStream: () => NEVER,
          getOrderBookStream: () => NEVER
        }),
        MockProvider(QuotesService, {
          getLastPrice: () => NEVER
        }),
        MockProvider(PortfolioSubscriptionsService, {
          getOrdersSubscription: () => NEVER,
          getStopOrdersSubscription: () => NEVER,
          getTradesSubscription: () => NEVER
        }),
        MockProvider(AllTradesService, {
          getNewTradesSubscription: () => NEVER,
        }),
        MockProvider(ScalperHotKeyCommandService, {
          commands$: new Subject()
        }),
        MockProvider(WidgetLocalStateService, {
          getStateRecord: jasmine.createSpy('getStateRecord').and.returnValue(new Subject()),
          setStateRecord: jasmine.createSpy('setStateRecord').and.callThrough()
        }),
        MockProvider(SCALPER_ORDERBOOK_SHARED_CONTEXT, {
          workingVolume$: new Subject(),
          gridSettings$: new BehaviorSubject({
            rowHeight: 18,
            fontSize: 12
          }),
          scaleFactor$: new Subject()
        }, 'useValue'),
        MockProvider(ScalperOrderBookSettingsWriteService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ScalperOrderBookBodyComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
