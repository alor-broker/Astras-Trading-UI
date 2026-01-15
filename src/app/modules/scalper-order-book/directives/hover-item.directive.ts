import { DestroyRef, Directive, ElementRef, OnInit, input, inject } from '@angular/core';
import {
  HOVER_ITEMS_GROUP,
  HoverItemsGroup
} from './hover-items-group.directive';
import {
  fromEvent
} from 'rxjs';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Directive({ selector: '[atsHoverItem]' })
export class HoverItemDirective<T = any> implements OnInit {
  private readonly el = inject(ElementRef);
  private readonly group = inject<HoverItemsGroup>(HOVER_ITEMS_GROUP, { skipSelf: true });
  private readonly destroyRef = inject(DestroyRef);

  readonly atsHoverItemData = input<T>();

  ngOnInit(): void {
    fromEvent(this.el.nativeElement, 'mouseenter').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.group.setHoveredItem(this);
    });

    fromEvent(this.el.nativeElement, 'mouseleave').pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.group.removeItemHover(this);
    });

    this.destroyRef.onDestroy(() => this.group.removeItemHover(this));
  }
}
