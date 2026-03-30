import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TradesPanelComponent} from './trades-panel.component';
import {ThemeService} from '../../../../shared/services/theme.service';
import {BehaviorSubject, Subject} from 'rxjs';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';

describe('TradesPanelComponent', () => {
  let component: TradesPanelComponent;
  let fixture: ComponentFixture<TradesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradesPanelComponent],
      providers: [
        {
          provide: ThemeService,
          useValue: {
            getThemeSettings: jasmine.createSpy('getThemeSettings').and.returnValue(new Subject())
          }
        }
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TradesPanelComponent);
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
