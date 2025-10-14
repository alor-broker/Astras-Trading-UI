import {Component, ContentChildren,
  input, OnDestroy, QueryList, ViewChild} from '@angular/core';
import {ScrollableItemDirective} from "../../directives/scrollable-item.directive";
import {CdkScrollable} from "@angular/cdk/overlay";
import {BehaviorSubject} from "rxjs";
import { NzResizeObserverDirective } from "ng-zorro-antd/cdk/resize-observer";
import {
  AsyncPipe,
} from "@angular/common";
import { NzIconDirective } from "ng-zorro-antd/icon";
import { SwipeDirective } from "../../directives/swipe.directive";

@Component({
  selector: 'ats-scrollable-row',
  templateUrl: './scrollable-row.component.html',
  imports: [
    NzResizeObserverDirective,
    CdkScrollable,
    NzIconDirective,
    AsyncPipe,
    SwipeDirective
  ],
  styleUrls: ['./scrollable-row.component.less']
})
export class ScrollableRowComponent implements OnDestroy {
  @ContentChildren(ScrollableItemDirective)
  items!: QueryList<ScrollableItemDirective>;

  showScrollButtons = input(true);

  hasScroll$ = new BehaviorSubject(false);

  @ViewChild(CdkScrollable)
  scrollContainer?: CdkScrollable;

  ngOnDestroy(): void {
    this.hasScroll$.complete();
  }

  move($event: MouseEvent | null, dir: 'left' | 'right'): void {
    $event?.preventDefault();
    $event?.stopPropagation();

    if (dir === "right") {
      this.moveRight();
    } else {
      this.moveLeft();
    }
  }

  moveRight(): void {
    const rightScroll = this.scrollContainer!.measureScrollOffset('right');
    if (rightScroll === 0) {
      return;
    }

    const container = this.scrollContainer!.getElementRef().nativeElement;
    const containerBounds = container.getBoundingClientRect();
    for (const child of this.items) {
      const item = child.getElementRef().nativeElement;
      const itemBounds = item.getBoundingClientRect();
      const relativeRight = itemBounds.x - containerBounds.x + itemBounds.width;

      if (Math.floor(relativeRight) > containerBounds.width) {
        this.scrollContainer!.scrollTo({
          right: Math.floor(rightScroll - (relativeRight - containerBounds.width)) - 1
        });

        return;
      }
    }
  }

  moveLeft(): void {
    const leftScroll = this.scrollContainer!.measureScrollOffset('left');
    if (leftScroll === 0) {
      return;
    }

    const container = this.scrollContainer!.getElementRef().nativeElement;
    const containerBounds = container.getBoundingClientRect();
    for (const child of this.items.toArray().reverse()) {
      const item = child.getElementRef().nativeElement;
      const itemBounds = item.getBoundingClientRect();

      if (itemBounds.x < containerBounds.x) {
        const relativeLeft = containerBounds.x - itemBounds.x;
        this.scrollContainer!.scrollTo({
          left: leftScroll - Math.ceil(relativeLeft)
        });

        return;
      }
    }
  }

  checkScroll(): void {
    if (!this.scrollContainer) {
      this.hasScroll$.next(false);
    } else {
      this.hasScroll$.next(
        this.scrollContainer.measureScrollOffset('right') > 0
        || this.scrollContainer.measureScrollOffset('left') > 0
      );
    }
  }
}
