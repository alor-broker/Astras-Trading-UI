import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  Observable,
  take
} from 'rxjs';
import {
  ScalperOrderBookRow,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';

export class ScalperOrderBookTableHelper {
  public static scrollTableToIndex(
    scrollViewport: CdkVirtualScrollViewport | null | undefined,
    tableRowHeight: number,
    index: number,
    applyCenterCorrection: boolean = true,
    withDelay: boolean = true) {
    setTimeout(() => {
        if (!scrollViewport) {
          return;
        }

        let correction = 0;
        if (applyCenterCorrection) {
          const viewPortSize = scrollViewport.elementRef.nativeElement.offsetHeight;
          const visibleItemsCount = viewPortSize / tableRowHeight;
          const centerCorrection = Math.floor(visibleItemsCount / 2) - 1;

          correction = -centerCorrection;
        }

        scrollViewport.scrollToIndex(index + correction);
      },
      withDelay ? 300 : 0
    );
  }

  public static alignTable(
    scrollViewport: CdkVirtualScrollViewport | null | undefined,
    tableRowHeight: number,
    orderBookTableData$: Observable<ScalperOrderBookRow[]>
  ) {
    orderBookTableData$.pipe(
      take(1)
    ).subscribe(tableData => {
      let targetIndex: number | null = null;
      const spreadRows = tableData.filter(r => r.rowType === ScalperOrderBookRowType.Spread);
      if (spreadRows.length > 0) {
        targetIndex = tableData.indexOf(spreadRows[0]) + Math.round(spreadRows.length / 2);
      }
      else {
        const bestSellRowIndex = tableData.findIndex(r => r.rowType === ScalperOrderBookRowType.Ask && r.isBest);
        if (bestSellRowIndex >= 0) {
          targetIndex = bestSellRowIndex;
        }
        else {
          const startRowIndex = tableData.findIndex(r => r.isStartRow);
          if (bestSellRowIndex >= 0) {
            targetIndex = startRowIndex;
          }
        }
      }

      if (!!targetIndex) {
        this.scrollTableToIndex(scrollViewport, tableRowHeight, targetIndex);
      }
    });
  }
}
