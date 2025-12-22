import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TradeClustersPanelComponent} from './trade-clusters-panel.component';
import {ContextMenuService} from '../../../../shared/services/context-menu.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';
import {TradeClustersService} from '../../services/trade-clusters.service';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives, MockProvider,} from "ng-mocks";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {TradesClusterComponent} from "../trades-cluster/trades-cluster.component";
import {NzDropdownMenuComponent} from "ng-zorro-antd/dropdown";
import {NzMenuDirective, NzMenuGroupComponent, NzMenuItemComponent} from "ng-zorro-antd/menu";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('TradeClustersPanelComponent', () => {
  let component: TradeClustersPanelComponent;
  let fixture: ComponentFixture<TradeClustersPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        TradeClustersPanelComponent,
        MockComponents(
          TradesClusterComponent,
          NzDropdownMenuComponent,
          NzMenuGroupComponent,
          NzMenuItemComponent,
        ),
        MockDirectives(
          NzResizeObserverDirective,
          NzIconDirective,
          NzMenuDirective
        )
      ],
      providers: [
        MockProvider(ScalperOrderBookSettingsWriteService),
        MockProvider(TradeClustersService, {
          getHistory: jasmine.createSpy('getHistory').and.returnValue(new Subject()),
          getClustersSubscription: jasmine.createSpy('getClustersSubscription').and.returnValue(new Subject())
        }),
        MockProvider(ContextMenuService)
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TradeClustersPanelComponent);
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
