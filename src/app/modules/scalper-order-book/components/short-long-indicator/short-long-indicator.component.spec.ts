import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ShortLongIndicatorComponent} from './short-long-indicator.component';
import {LetDirective} from "@ngrx/component";
import {EvaluationService} from "../../../../shared/services/evaluation.service";
import {BehaviorSubject, Subject} from "rxjs";
import {ScalperOrderBookDataContext} from "../../models/scalper-order-book-data-context.model";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockDirectives} from "ng-mocks";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";

describe('ShortLongIndicatorComponent', () => {
  let component: ShortLongIndicatorComponent;
  let fixture: ComponentFixture<ShortLongIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        TranslocoTestsModule.getModule(),
        ShortLongIndicatorComponent,
        MockDirectives(
          TranslocoDirective,
          NzTooltipDirective,
        )
      ],
      providers: [
        {
          provide: EvaluationService,
          useValue: {
            evaluateOrder: jasmine.createSpy('evaluateOrder').and.returnValue(new Subject())
          }
        }
      ]
    });
    fixture = TestBed.createComponent(ShortLongIndicatorComponent);
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
