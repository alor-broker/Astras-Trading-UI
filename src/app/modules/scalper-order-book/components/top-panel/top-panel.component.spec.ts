import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopPanelComponent } from './top-panel.component';
import { mockComponent } from "../../../../shared/utils/testing";
import {
  BehaviorSubject,
  Subject
} from "rxjs";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import { LetDirective } from "@ngrx/component";

describe('TopPanelComponent', () => {
  let component: TopPanelComponent;
  let fixture: ComponentFixture<TopPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LetDirective],
      declarations: [
        TopPanelComponent,
        mockComponent({ selector: 'ats-modifiers-indicator'}),
        mockComponent({ selector: 'ats-working-volumes-panel', inputs: ['guid', 'isActive', 'orientation']}),
        mockComponent({ selector: 'ats-short-long-indicator', inputs: ['dataContext', 'orientation']}),
      ]
    });
    fixture = TestBed.createComponent(TopPanelComponent);
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
      addLocalOrder: order => {},
      removeLocalOrder: orderId => {},
      destroy: () => {}
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
