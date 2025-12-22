import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TopPanelComponent} from './top-panel.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {LetDirective} from "@ngrx/component";
import {MockComponents} from "ng-mocks";
import {WorkingVolumesPanelComponent} from "../working-volumes-panel/working-volumes-panel.component";
import {ModifiersIndicatorComponent} from "../modifiers-indicator/modifiers-indicator.component";
import {ShortLongIndicatorComponent} from "../short-long-indicator/short-long-indicator.component";

describe('TopPanelComponent', () => {
  let component: TopPanelComponent;
  let fixture: ComponentFixture<TopPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TopPanelComponent,
        MockComponents(
          WorkingVolumesPanelComponent,
          ModifiersIndicatorComponent,
          ShortLongIndicatorComponent
        )
      ]
    });
    fixture = TestBed.createComponent(TopPanelComponent);
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
