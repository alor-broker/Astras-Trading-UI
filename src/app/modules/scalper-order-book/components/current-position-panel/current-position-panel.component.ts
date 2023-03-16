import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  combineLatest,
  Observable
} from 'rxjs';
import { map } from 'rxjs/operators';
import { MathHelper } from '../../../../shared/utils/math-helper';
import { ScalperOrderBookPositionState } from '../../models/scalper-order-book.model';
import { ScalperOrderBookDataContextService } from '../../services/scalper-order-book-data-context.service';

@Component({
  selector: 'ats-current-position-panel[guid]',
  templateUrl: './current-position-panel.component.html',
  styleUrls: ['./current-position-panel.component.less']
})
export class CurrentPositionPanelComponent implements OnInit {
  @Input() guid!: string;

  orderBookPosition$!: Observable<ScalperOrderBookPositionState | null>;

  constructor(private readonly dataContextService: ScalperOrderBookDataContextService) {
  }

  ngOnInit(): void {
    this.orderBookPosition$ = this.getPositionStateStream();
  }

  private getPositionStateStream(): Observable<ScalperOrderBookPositionState | null> {
    const settings$ = this.dataContextService.getSettingsStream(this.guid);

    return combineLatest([
      settings$,
      this.dataContextService.getOrderBookDataStream(settings$),
      this.dataContextService.getOrderBookPositionStream(settings$, this.dataContextService.getOrderBookPortfolio())
    ]).pipe(
      map(([settings, orderBook, position]) => {
        if (!position || position.qtyTFuture === 0 || orderBook.data.a.length === 0 || orderBook.data.b.length === 0) {
          return null;
        }

        const sign = position!.qtyTFuture > 0 ? 1 : -1;
        const bestPrice = sign > 0
          ? orderBook.data.b[0].p
          : orderBook.data.a[0].p;

        const rowsDifference = Math.round((bestPrice - position!.avgPrice) / settings.instrument.minstep) * sign;

        const minStepDigitsAfterPoint = MathHelper.getPrecision(settings.instrument.minstep);

        return {
          qty: position!.qtyTFutureBatch,
          price: MathHelper.round(position!.avgPrice, minStepDigitsAfterPoint),
          lossOrProfit: rowsDifference
        };
      })
    );
  }
}
