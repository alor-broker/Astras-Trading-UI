import {
  Directive,
  EventEmitter,
  InjectionToken,
  Input,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import {
  BehaviorSubject,
  take,
  takeUntil
} from 'rxjs';
import { HoverItemDirective } from './hover-item.directive';
import { Destroyable } from '../../../shared/utils/destroyable';

export const HOVER_ITEMS_GROUP = new InjectionToken<HoverItemsGroup>('HoverItemsGroup');

export interface HoverItemsGroup<T = any> {
  setHoveredItem(item: HoverItemDirective<T>): void;

  removeItemHover(item: HoverItemDirective<T>): void;
}

@Directive({
  selector: '[atsHoverItemsGroup]',
  providers: [{ provide: HOVER_ITEMS_GROUP, useExisting: HoverItemsGroupDirective }],
})
export class HoverItemsGroupDirective<T = any> implements HoverItemsGroup<T>, OnInit, OnDestroy {
  @Input()
  atsHoverItemsGroup?: boolean = true;

  @Output()
  hoveredItemChanged = new EventEmitter<{ item: HoverItemDirective<T> } | null>();
  private readonly destroyable = new Destroyable();
  private readonly hoveredItem$ = new BehaviorSubject<{ item: HoverItemDirective<T> } | null>(null);

  constructor() {
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

  ngOnDestroy(): void {
    this.destroyable.destroy();
  }

  ngOnInit(): void {
    if(!this.atsHoverItemsGroup) {
      return;
    }

    this.hoveredItem$.pipe(
      takeUntil(this.destroyable.destroyed$)
    ).subscribe(i => this.hoveredItemChanged.emit(i));
  }
}
