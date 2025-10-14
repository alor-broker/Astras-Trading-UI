import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { OrderEvaluationComponent } from './order-evaluation.component';
import { Subject } from "rxjs";
import { EvaluationService } from "../../../../shared/services/evaluation.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('OrderEvaluationComponent', () => {
  let component: OrderEvaluationComponent;
  let fixture: ComponentFixture<OrderEvaluationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        OrderEvaluationComponent
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
    fixture = TestBed.createComponent(OrderEvaluationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
