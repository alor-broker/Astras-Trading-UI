import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TradesClusterComponent } from './trades-cluster.component';
import {
  BehaviorSubject,
  Subject
} from 'rxjs';
import { ScalperOrderBookDataContext } from '../../models/scalper-order-book-data-context.model';

describe('TradesClusterComponent', () => {
  let component: TradesClusterComponent;
  let fixture: ComponentFixture<TradesClusterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TradesClusterComponent]
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
