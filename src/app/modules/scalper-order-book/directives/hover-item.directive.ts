import {
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  SkipSelf
} from '@angular/core';
import {
  HOVER_ITEMS_GROUP,
  HoverItemsGroup
} from './hover-items-group.directive';
import { Destroyable } from '../../../shared/utils/destroyable';
import {
  fromEvent,
  takeUntil
} from 'rxjs';

@Directive({
  selector: '[atsHoverItem]'
})
export class HoverItemDirective<T = any> implements OnInit, OnDestroy {

  @Input()
  atsHoverItemData?: T;
  private readonly destroyable = new Destroyable();

  constructor(
    private readonly renderer: Renderer2,
    private readonly el: ElementRef,
    @Inject(HOVER_ITEMS_GROUP)
    @SkipSelf()
    private readonly group: HoverItemsGroup) {
  }

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  ngOnInit(): void {
    fromEvent(this.el.nativeElement, 'mouseenter').pipe(
      takeUntil(this.destroyable)
    ).subscribe(() => {
      this.group.setHoveredItem(this);
    });

    fromEvent(this.el.nativeElement, 'mouseleave').pipe(
      takeUntil(this.destroyable)
    ).subscribe(() => {
      this.group.removeItemHover(this);
    });

    this.destroyable.onDestroy(() => this.group.removeItemHover(this));
  }
}
