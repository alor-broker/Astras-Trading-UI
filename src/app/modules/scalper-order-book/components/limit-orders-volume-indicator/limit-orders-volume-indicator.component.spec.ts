import {ComponentFixture, TestBed} from '@angular/core/testing';

import {LimitOrdersVolumeIndicatorComponent} from './limit-orders-volume-indicator.component';
import {BehaviorSubject, Subject} from "rxjs";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {Side} from "../../../../shared/models/enums/side.model";
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives} from "ng-mocks";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

describe('LimitOrdersVolumeIndicatorComponent', () => {
  let component: LimitOrdersVolumeIndicatorComponent;
  let fixture: ComponentFixture<LimitOrdersVolumeIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        LimitOrdersVolumeIndicatorComponent,
        MockDirectives(
          NzTooltipDirective
        )
      ]
    });
    fixture = TestBed.createComponent(LimitOrdersVolumeIndicatorComponent);
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

    fixture.componentRef.setInput(
      'side',
      Side.Buy
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
