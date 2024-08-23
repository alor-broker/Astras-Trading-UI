import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TradeClustersPanelComponent } from './trade-clusters-panel.component';
import { getTranslocoModule } from '../../../../shared/utils/testing';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { ContextMenuService } from '../../../../shared/services/context-menu.service';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { TradeClustersService } from '../../services/trade-clusters.service';

describe('TradeClustersPanelComponent', () => {
  let component: TradeClustersPanelComponent;
  let fixture: ComponentFixture<TradeClustersPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [TradeClustersPanelComponent],
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            updateSettings: jasmine.createSpy('updateSettings').and.callThrough()
          }
        },
        {
          provide: TradeClustersService,
          useValue: {
            getHistory: jasmine.createSpy('getHistory').and.returnValue(new Subject()),
            getClustersSubscription: jasmine.createSpy('getClustersSubscription').and.returnValue(new Subject())
          }
        },
        {
          provide: ContextMenuService,
          useValue: {
            create: jasmine.createSpy('create').and.callThrough(),
            close: jasmine.createSpy('close').and.callThrough(),
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TradeClustersPanelComponent);
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
