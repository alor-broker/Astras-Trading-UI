import { DestroyRef, Directive, InjectionToken, OnInit, input, output, inject } from '@angular/core';
import {
  BehaviorSubject,
  take,
} from 'rxjs';
import { HoverItemDirective } from './hover-item.directive';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

export const HOVER_ITEMS_GROUP = new InjectionToken<HoverItemsGroup>('HoverItemsGroup');

export interface HoverItemsGroup<T = any> {
  setHoveredItem(item: HoverItemDirective<T>): void;

  removeItemHover(item: HoverItemDirective<T>): void;
}

@Directive({
    selector: '[atsHoverItemsGroup]',
    providers: [{ provide: HOVER_ITEMS_GROUP, useExisting: HoverItemsGroupDirective }]
})
export class HoverItemsGroupDirective<T = any> implements HoverItemsGroup<T>, OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly atsHoverItemsGroup = input<boolean | undefined>(true);

  readonly hoveredItemChanged = output<{
    item: HoverItemDirective<T>;
} | null>();

  private readonly hoveredItem$ = new BehaviorSubject<{ item: HoverItemDirective<T> } | null>(null);

  removeItemHover(item: HoverItemDirective<T>): void {
    this.hoveredItem$.pipe(
      take(1)
    ).subscribe(i => {
      if (i?.item === item) {
        this.hoveredItem$.next(null);
      }
    });
  }

  setHoveredItem(item: HoverItemDirective<T>): void {
    this.hoveredItem$.next({ item });
  }

  ngOnInit(): void {
    if(!(this.atsHoverItemsGroup() ?? false)) {
      return;
    }

    this.hoveredItem$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(i => this.hoveredItemChanged.emit(i));
  }
}
