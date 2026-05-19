import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  ViewEncapsulation
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay,
  switchMap
} from "rxjs";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  AsyncPipe,
  CurrencyPipe
} from "@angular/common";
import {
  NzDescriptionsComponent,
  NzDescriptionsItemComponent
} from "ng-zorro-antd/descriptions";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {TranslocoDirective} from "@jsverse/transloco";
import {toObservable} from "@angular/core/rxjs-interop";
import {
  Evaluation,
  SingleOrderEvaluation
} from '@terminal-core-lib/features/orders/services/evaluation-service.types';
import {EvaluationService} from '@terminal-core-lib/features/orders/services/evaluation.service';

type EvaluationDisplay = Evaluation & { currency: string };

@Component({
  selector: 'ats-order-evaluation',
  templateUrl: './order-evaluation.html',
  imports: [
    AsyncPipe,
    NzDescriptionsComponent,
    NzDescriptionsItemComponent,
    CurrencyPipe,
    NzTooltipDirective,
    TranslocoDirective
  ],
  styleUrls: ['./order-evaluation.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OrderEvaluation implements OnInit {
  evaluation$!: Observable<EvaluationDisplay | null>;

  readonly quantitySelect = output<number>();

  readonly evaluationProperties = input.required<SingleOrderEvaluation | null>();

  private readonly evaluationService = inject(EvaluationService);

  private readonly evaluationPropertiesChanges$ = toObservable(this.evaluationProperties).pipe(
    startWith(null),
    shareReplay(1)
  );

  ngOnInit(): void {
    const getEvaluationDisplay = (request: SingleOrderEvaluation): Observable<EvaluationDisplay | null> => this.evaluationService.evaluateOrder(request).pipe(
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
