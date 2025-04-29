import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BehaviorSubject, filter, Observable, switchMap} from "rxjs";
import {EvaluationBaseProperties} from "../../../../shared/models/evaluation-base-properties.model";
import {EvaluationService} from "../../../../shared/services/evaluation.service";
import {map} from "rxjs/operators";
import {Evaluation} from "../../../../shared/models/evaluation.model";

type EvaluationDisplay = Evaluation & { currency: string };

@Component({
    selector: 'ats-order-evaluation',
    templateUrl: './order-evaluation.component.html',
    styleUrls: ['./order-evaluation.component.less'],
    standalone: false
})
export class OrderEvaluationComponent implements OnInit {
  evaluation$!: Observable<EvaluationDisplay | null>;
  @Output() quantitySelect = new EventEmitter<number>();
  private readonly evaluationRequest$: BehaviorSubject<EvaluationBaseProperties | null> = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  constructor(private readonly evaluationService: EvaluationService) {
  }

  @Input({required: true})
  set evaluationProperties(evaluationProperties: EvaluationBaseProperties | null) {
    this.evaluationRequest$.next(evaluationProperties);
  }

  ngOnInit(): void {
    const getEvaluationDisplay = (request: EvaluationBaseProperties): Observable<EvaluationDisplay> => this.evaluationService.evaluateOrder(request).pipe(
      map(evaluation => ({
        ...evaluation,
        currency: request.instrumentCurrency ?? 'RUB'
      } as EvaluationDisplay))
    );

    this.evaluation$ = this.evaluationRequest$.pipe(
      filter((er): er is EvaluationBaseProperties => !!er),
      switchMap(er => getEvaluationDisplay(er))
    );
  }
}
