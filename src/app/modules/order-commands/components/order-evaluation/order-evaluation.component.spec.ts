import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderEvaluationComponent } from './order-evaluation.component';
import {QuotesService} from "../../../../shared/services/quotes.service";
import {Subject} from "rxjs";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {EvaluationService} from "../../../../shared/services/evaluation.service";

describe('OrderEvaluationComponent', () => {
  let component: OrderEvaluationComponent;
  let fixture: ComponentFixture<OrderEvaluationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OrderEvaluationComponent],
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
