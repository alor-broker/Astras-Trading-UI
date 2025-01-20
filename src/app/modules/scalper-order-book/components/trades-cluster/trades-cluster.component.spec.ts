import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesClusterComponent } from './trades-cluster.component';
import {
  BehaviorSubject,
  EMPTY,
  Subject
} from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';
import { LetDirective } from "@ngrx/component";
import { MockProvider } from "ng-mocks";
import { ThemeService } from "../../../../shared/services/theme.service";

describe('TradesClusterComponent', () => {
  let component: TradesClusterComponent;
  let fixture: ComponentFixture<TradesClusterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetDirective],
      declarations: [TradesClusterComponent],
      providers: [
        MockProvider(
          ThemeService,
          {
            getThemeSettings: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TradesClusterComponent);
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
