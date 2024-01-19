import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShortLongIndicatorComponent } from './short-long-indicator.component';
import { LetDirective } from "@ngrx/component";
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { EvaluationService } from "../../../../shared/services/evaluation.service";
import { Subject } from "rxjs";
import { ScalperOrderBookDataContext } from "../../models/scalper-order-book-data-context.model";

describe('ShortLongIndicatorComponent', () => {
  let component: ShortLongIndicatorComponent;
  let fixture: ComponentFixture<ShortLongIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        LetDirective,
        getTranslocoModule()
      ],
      declarations: [
        ShortLongIndicatorComponent,
        ...ngZorroMockComponents
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
    } as ScalperOrderBookDataContext;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
