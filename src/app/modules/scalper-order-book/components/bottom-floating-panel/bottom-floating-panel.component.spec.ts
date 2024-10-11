import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BottomFloatingPanelComponent } from './bottom-floating-panel.component';
import {
  BehaviorSubject,
  Subject
} from "rxjs";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";
import { LetDirective } from "@ngrx/component";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('BottomFloatingPanelComponent', () => {
  let component: BottomFloatingPanelComponent;
  let fixture: ComponentFixture<BottomFloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective
      ],
      declarations: [
        BottomFloatingPanelComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-modifiers-indicator'}),
        ComponentHelpers.mockComponent({ selector: 'ats-working-volumes-panel', inputs: ['guid', 'isActive', 'orientation']}),
        ComponentHelpers.mockComponent({ selector: 'ats-short-long-indicator', inputs: ['dataContext', 'orientation']}),
      ]
    });
    fixture = TestBed.createComponent(BottomFloatingPanelComponent);
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
