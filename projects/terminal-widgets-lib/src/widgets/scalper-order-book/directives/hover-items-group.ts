import {
  DestroyRef,
  Directive,
  inject,
  InjectionToken,
  input,
  OnInit,
  output
} from '@angular/core';
import {
  BehaviorSubject,
  take
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {HoverItem} from '@terminal-widgets-lib/widgets/scalper-order-book/directives/hover-item';

export const HOVER_ITEMS_GROUP = new InjectionToken<HoverItemsGroup>('HoverItemsGroup');

export interface HoverItemsGroup<T = any> {
  setHoveredItem(item: HoverItem<T>): void;

  removeItemHover(item: HoverItem<T>): void;
}

@Directive({
  selector: '[atsHoverItemsGroup]',
  providers: [{provide: HOVER_ITEMS_GROUP, useExisting: HoverItemsGroup}]
})
export class HoverItemsGroup<T = any> implements HoverItemsGroup<T>, OnInit {
  readonly atsHoverItemsGroup = input<boolean | undefined>(true);

  readonly hoveredItemChanged = output<{
    item: HoverItem<T>;
  } | null>();

  private readonly destroyRef = inject(DestroyRef);

  private readonly hoveredItem$ = new BehaviorSubject<{ item: HoverItem<T> } | null>(null);

  removeItemHover(item: HoverItem<T>): void {
    this.hoveredItem$.pipe(
      take(1)
    ).subscribe(i => {
      if (i?.item === item) {
        this.hoveredItem$.next(null);
      }
    });
  }

  setHoveredItem(item: HoverItem<T>): void {
    this.hoveredItem$.next({item});
  }

  ngOnInit(): void {
    if (!(this.atsHoverItemsGroup() ?? false)) {
      return;
    }

    this.hoveredItem$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(i => this.hoveredItemChanged.emit(i));
  }
}
