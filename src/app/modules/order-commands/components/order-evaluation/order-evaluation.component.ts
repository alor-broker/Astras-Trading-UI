import { Component, input, OnInit, output, inject } from '@angular/core';
import {Observable, of, shareReplay, switchMap} from "rxjs";
import {EvaluationBaseProperties} from "../../../../shared/models/evaluation-base-properties.model";
import {EvaluationService} from "../../../../shared/services/evaluation.service";
import {map, startWith} from "rxjs/operators";
import {Evaluation} from "../../../../shared/models/evaluation.model";
import {AsyncPipe, CurrencyPipe} from "@angular/common";
import {NzDescriptionsComponent, NzDescriptionsItemComponent} from "ng-zorro-antd/descriptions";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {TranslocoDirective} from "@jsverse/transloco";
import {toObservable} from "@angular/core/rxjs-interop";

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
  private readonly evaluationService = inject(EvaluationService);

  evaluation$!: Observable<EvaluationDisplay | null>;

  readonly quantitySelect = output<number>();

  readonly evaluationProperties = input.required<EvaluationBaseProperties | null>();
  private readonly evaluationPropertiesChanges$ = toObservable(this.evaluationProperties).pipe(
    startWith(null),
    shareReplay(1)
  );

  ngOnInit(): void {
    const getEvaluationDisplay = (request: EvaluationBaseProperties): Observable<EvaluationDisplay | null> => this.evaluationService.evaluateOrder(request).pipe(
      map(evaluation => {
        if (evaluation == null) {
          return null;
        }

        return {
          ...evaluation,
          currency: evaluation.currency ?? request.instrumentCurrency ?? 'RUB'
        } as EvaluationDisplay;
      })
    );

    this.evaluation$ = this.evaluationPropertiesChanges$.pipe(
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
