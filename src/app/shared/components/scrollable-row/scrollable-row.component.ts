import {Component, ContentChildren, OnDestroy, QueryList, ViewChild} from '@angular/core';
import {ScrollableItemDirective} from "../../directives/scrollable-item.directive";
import {CdkScrollable} from "@angular/cdk/overlay";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'ats-scrollable-row',
  templateUrl: './scrollable-row.component.html',
  styleUrls: ['./scrollable-row.component.less']
})
export class ScrollableRowComponent implements OnDestroy {
  @ContentChildren(ScrollableItemDirective)
  items!: QueryList<ScrollableItemDirective>;

  hasScroll$ = new BehaviorSubject(false);

  @ViewChild(CdkScrollable)
  scrollContainer!: CdkScrollable;

  ngOnDestroy(): void {
    this.hasScroll$.complete();
  }

  move($event: MouseEvent, dir: 'left' | 'right') {
    $event.preventDefault();
    $event.stopPropagation();

    if (dir === "right") {
      this.moveRight();
      return;
    }

    if (dir === "left") {
      this.moveLeft();
      return;
    }
  }

  moveRight() {
    const rightScroll = this.scrollContainer.measureScrollOffset('right');
    if (rightScroll === 0) {
      return;
    }

    const container = this.scrollContainer.getElementRef().nativeElement;
    const containerBounds = container.getBoundingClientRect();
    for (let child of this.items) {
      const item = child.getElementRef().nativeElement;
      const itemBounds = item.getBoundingClientRect();
      const relativeRight = itemBounds.x - containerBounds.x + itemBounds.width;

      if (Math.floor(relativeRight) > containerBounds.width) {
        this.scrollContainer.scrollTo({
          right: Math.floor(rightScroll - (relativeRight - containerBounds.width)) - 1
        });

        return;
      }
    }
  }

  moveLeft() {
    const leftScroll = this.scrollContainer.measureScrollOffset('left');
    if (leftScroll === 0) {
      return;
    }

    const container = this.scrollContainer.getElementRef().nativeElement;
    const containerBounds = container.getBoundingClientRect();
    for (let child of this.items.toArray().reverse()) {
      const item = child.getElementRef().nativeElement;
      const itemBounds = item.getBoundingClientRect();

      if (itemBounds.x < containerBounds.x) {
        const relativeLeft = containerBounds.x - itemBounds.x;
        this.scrollContainer.scrollTo({
          left: leftScroll - Math.ceil(relativeLeft)
        });

        return;
      }
    }
  }

  checkScroll() {
    if (!this.scrollContainer) {
      this.hasScroll$.next(false);
    }

    this.hasScroll$.next(
      this.scrollContainer.measureScrollOffset('right') > 0
      || this.scrollContainer.measureScrollOffset('left') > 0
    );
  }
}
