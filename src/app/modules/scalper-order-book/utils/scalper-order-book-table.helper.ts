import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';

export class ScalperOrderBookTableHelper {
  public static scrollTableToIndex(
    scrollViewport: CdkVirtualScrollViewport | null | undefined,
    tableRowHeight: number,
    index: number,
    applyCenterCorrection = true,
    withDelay = true): void {
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
}
