import { ElementRef } from '@angular/core';
import {
  Observable,
  Subject
} from 'rxjs';
import {
  finalize,
  map,
  startWith
} from 'rxjs/operators';

export class TableAutoHeightBehavior {
  static getScrollHeight(tableContainer: ElementRef<HTMLElement>, startHeight = 50): Observable<number> {
    const subject = new Subject<number>();
    const resizeObserver = new ResizeObserver(entries => {
      const tableHeader = tableContainer.nativeElement.querySelector('.ant-table-thead');
      const tableFooter = tableContainer.nativeElement.querySelector('.ant-table-footer');

      entries.forEach(x => {
        const newHeight = Math.floor(x.contentRect.height - (tableHeader?.clientHeight ?? 0) - (tableFooter?.clientHeight ?? 0));

        if(newHeight > 0) {
          subject.next(newHeight);
        } else {
          subject.next(startHeight);
        }
      });
    });

    resizeObserver.observe(tableContainer.nativeElement);

    return subject.pipe(
      startWith(startHeight),
      finalize(() => {
        resizeObserver.unobserve(tableContainer.nativeElement);

        resizeObserver.disconnect();
      }),
      map(x => x === 0 ? startHeight : x)
    );
  }
}
