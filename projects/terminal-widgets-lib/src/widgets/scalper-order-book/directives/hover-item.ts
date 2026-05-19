import {
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  OnInit
} from '@angular/core';
import {
  HOVER_ITEMS_GROUP,
  HoverItemsGroup
} from '@terminal-widgets-lib/widgets/scalper-order-book/directives/hover-items-group';
import {fromEvent} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Directive({selector: '[atsHoverItem]'})
export class HoverItem<T = any> implements OnInit {
  readonly atsHoverItemData = input<T>();

  private readonly el = inject(ElementRef);

  private readonly group = inject<HoverItemsGroup>(HOVER_ITEMS_GROUP, {skipSelf: true});

  private readonly destroyRef = inject(DestroyRef);

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
