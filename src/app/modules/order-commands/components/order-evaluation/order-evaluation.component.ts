import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  of,
  switchMap
} from "rxjs";
import { EvaluationBaseProperties } from "../../../../shared/models/evaluation-base-properties.model";
import { EvaluationService } from "../../../../shared/services/evaluation.service";
import { map } from "rxjs/operators";
import { Evaluation } from "../../../../shared/models/evaluation.model";
import {
  AsyncPipe,
  CurrencyPipe
} from "@angular/common";
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from "ng-zorro-antd/descriptions";
import { NzTooltipDirective } from "ng-zorro-antd/tooltip";
import { TranslocoDirective } from "@jsverse/transloco";

type EvaluationDisplay = Evaluation & { currency: string };

@Component({
  selector: 'ats-order-evaluation',
  templateUrl: './order-evaluation.component.html',
  imports: [
    AsyncPipe,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    CurrencyPipe,
    NzTooltipDirective,
    TranslocoDirective
  ],
  styleUrls: ['./order-evaluation.component.less']
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
    const getEvaluationDisplay = (request: EvaluationBaseProperties): Observable<EvaluationDisplay | null> => this.evaluationService.evaluateOrder(request).pipe(
      map(evaluation => {
        if (evaluation == null) {
          return null;
        }

        return {
          ...evaluation,
          currency: request.instrumentCurrency ?? 'RUB'
        } as EvaluationDisplay;
      })
    );

    this.evaluation$ = this.evaluationRequest$.pipe(
      switchMap(er => {
        if (er == null) {
          return of(null);
        }

        return getEvaluationDisplay(er);
      })
    );
  }

  protected emitQuantitySelect(value: number | null): void {
    if (value != null) {
      this.quantitySelect.emit(value);
    }
  }
}
