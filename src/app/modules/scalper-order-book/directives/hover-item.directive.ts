import {
  DestroyRef,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnInit,
  SkipSelf
} from '@angular/core';
import {
  HOVER_ITEMS_GROUP,
  HoverItemsGroup
} from './hover-items-group.directive';
import {
  fromEvent
} from 'rxjs';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Directive({
  selector: '[atsHoverItem]'
})
export class HoverItemDirective<T = any> implements OnInit {
  @Input()
  atsHoverItemData?: T;

  constructor(
    private readonly el: ElementRef,
    @Inject(HOVER_ITEMS_GROUP)
    @SkipSelf()
    private readonly group: HoverItemsGroup,
    private readonly destroyRef: DestroyRef) {
  }

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
