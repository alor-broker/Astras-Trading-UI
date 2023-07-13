import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { EvaluationBaseProperties } from '../../../../shared/models/evaluation-base-properties.model';
import { EvaluationService } from '../../../../shared/services/evaluation.service';
import { Evaluation } from '../../../../shared/models/evaluation.model';

type EvaluationDisplay = Evaluation & { currency: string };

@Component({
  selector: 'ats-evaluation',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.less']
})
export class EvaluationComponent implements OnInit {
  @Input()
  quantity = 0;
  evaluation$!: Observable<EvaluationDisplay | null>;
  evaluationRequest$: BehaviorSubject<EvaluationBaseProperties | null> = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  constructor(private service: EvaluationService) {
  }

  @Input({required: true})
  set evaluationProperties(evaluationProperties: EvaluationBaseProperties) {
    this.evaluationRequest$.next(evaluationProperties);
  }

  @Output() quantitySelect = new EventEmitter<number>();

  ngOnInit(): void {
    const getEvaluationDisplay = (request: EvaluationBaseProperties) => this.service.evaluateOrder(request).pipe(
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
