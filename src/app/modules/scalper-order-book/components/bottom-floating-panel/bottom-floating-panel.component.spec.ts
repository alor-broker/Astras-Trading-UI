import {ComponentFixture, TestBed} from '@angular/core/testing';

import {BottomFloatingPanelComponent} from './bottom-floating-panel.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {LetDirective} from "@ngrx/component";
import {MockComponents} from "ng-mocks";
import {ModifiersIndicatorComponent} from "../modifiers-indicator/modifiers-indicator.component";
import {ShortLongIndicatorComponent} from "../short-long-indicator/short-long-indicator.component";
import {WorkingVolumesPanelComponent} from "../working-volumes-panel/working-volumes-panel.component";

describe('BottomFloatingPanelComponent', () => {
  let component: BottomFloatingPanelComponent;
  let fixture: ComponentFixture<BottomFloatingPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        BottomFloatingPanelComponent,
        MockComponents(
          ModifiersIndicatorComponent,
          ShortLongIndicatorComponent,
          WorkingVolumesPanelComponent
        )
      ]
    });
    fixture = TestBed.createComponent(BottomFloatingPanelComponent);
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
