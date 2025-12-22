import {
  DestroyRef,
  Directive,
  EventEmitter,
  InjectionToken,
  OnInit,
  Output,
  input
} from '@angular/core';
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
  readonly atsHoverItemsGroup = input<boolean | undefined>(true);

  @Output()
  hoveredItemChanged = new EventEmitter<{ item: HoverItemDirective<T> } | null>();

  private readonly hoveredItem$ = new BehaviorSubject<{ item: HoverItemDirective<T> } | null>(null);

  constructor(private readonly destroyRef: DestroyRef) {
  }

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
