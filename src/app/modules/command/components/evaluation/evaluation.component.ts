import { Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, filter, Observable, switchMap } from 'rxjs';
import { EvaluationBaseProperties } from '../../models/evaluation-base-properties.model';
import { Evaluation } from '../../models/evaluation.model';
import { EvaluationService } from '../../services/evaluation.service';

@Component({
  selector: 'ats-evaluation[evaluationProperties]',
  templateUrl: './evaluation.component.html',
  styleUrls: ['./evaluation.component.less']
})
export class EvaluationComponent implements OnInit {
  @Input()
  quantity = 0

  @Input('evaluationProperties') set evaluationProperties(evaluationProperties: EvaluationBaseProperties) {
    this.evaluationRequest.next(evaluationProperties);
  }

  evaluation$: Observable<Evaluation>;
  evaluationRequest: BehaviorSubject<EvaluationBaseProperties | null> = new BehaviorSubject<EvaluationBaseProperties | null>(null);

  constructor(private service: EvaluationService) {
    this.evaluation$ = this.evaluationRequest.pipe(
      filter((er): er is EvaluationBaseProperties => !!er),
      switchMap(er => this.service.evaluateOrder(er))
    )
  }

  ngOnInit(): void {
  }

}
