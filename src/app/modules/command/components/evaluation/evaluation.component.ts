import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { Evaluation } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';
import { map } from 'rxjs/operators';

type EvaluationDisplay = Evaluation & { currency: string };

@Component({
  selector: 'ats-evaluation[evaluationProperties]',
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

  @Input()
  set evaluationProperties(evaluationProperties: EvaluationBaseProperties) {
    this.evaluationRequest$.next(evaluationProperties);
  }

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
