import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TradesPanelComponent } from './trades-panel.component';
import { ThemeService } from '../../../../shared/services/theme.service';
import { Subject } from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';

describe('TradesPanelComponent', () => {
  let component: TradesPanelComponent;
  let fixture: ComponentFixture<TradesPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TradesPanelComponent],
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
    component.dataContext = {
      extendedSettings$: new Subject(),
      orderBookData$: new Subject(),
      position$: new Subject(),
      currentOrders$: new Subject(),
      currentPortfolio$: new Subject(),
      trades$: new Subject(),
      orderBookBody$: new Subject(),
      displayRange$: new Subject(),
      workingVolume$: new Subject(),
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
