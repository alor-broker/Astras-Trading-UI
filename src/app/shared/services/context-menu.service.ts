import {
  ConnectionPositionPair,
  Overlay,
  OverlayRef,
  ScrollStrategy
} from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { Injectable, NgZone, inject } from '@angular/core';
import { fromEvent, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';

const listOfPositions = [
  new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'top' }),
  new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'start', overlayY: 'bottom' }),
  new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'end', overlayY: 'bottom' }),
  new ConnectionPositionPair({ originX: 'start', originY: 'top' }, { overlayX: 'end', overlayY: 'top' })
];

export interface ContextMenuServiceConfig {
  scrollStrategy: 'close' | 'noop' | 'block';
}

export const ContextMenuServiceDefaultConfig: ContextMenuServiceConfig = {
  scrollStrategy: 'close'
};

// This is ng-zorro-antd modified code. See link for sources: https://github.com/NG-ZORRO/ng-zorro-antd/blob/master/components/dropdown/context-menu.service.ts
// It was extended with ability to set scroll strategy. By default context menu will be hidden by scroll.
@Injectable({
  providedIn: 'root'
})
export class ContextMenuService {
  private readonly ngZone = inject(NgZone);
  private readonly overlay = inject(Overlay);

  private overlayRef: OverlayRef | null = null;
  private closeSubscription = Subscription.EMPTY;

  create(
    $event: MouseEvent | { x: number, y: number },
    nzDropdownMenuComponent: NzDropdownMenuComponent,
    config: ContextMenuServiceConfig = ContextMenuServiceDefaultConfig): void {
    this.close(true);
    const { x, y } = $event;

    if ($event instanceof MouseEvent) {
      $event.preventDefault();
    }

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo({ x, y })
      .withPositions(listOfPositions)
      .withTransformOriginOn('.ant-dropdown');

    this.overlayRef = this.overlay.create({
      positionStrategy,
      disposeOnNavigation: true,
      scrollStrategy: this.getScrollStrategy(config)
    });

    this.closeSubscription = new Subscription();

    this.closeSubscription.add(nzDropdownMenuComponent.descendantMenuItemClick$.subscribe(() => this.close()));

    this.closeSubscription.add(
      this.ngZone.runOutsideAngular(() =>
        fromEvent<MouseEvent>(document, 'click')
          .pipe(
            filter(event => !!this.overlayRef && !this.overlayRef.overlayElement.contains(event.target as HTMLElement)),
            /** handle firefox contextmenu event **/
            filter(event => event.button !== 2),
            take(1)
          )
          .subscribe(() => this.ngZone.run(() => this.close()))
      )
    );

    this.overlayRef.attach(
      new TemplatePortal(nzDropdownMenuComponent.templateRef, nzDropdownMenuComponent.viewContainerRef)
    );
  }

  close(clear = false): void {
    if (this.overlayRef) {
      this.overlayRef.detach();
      if (clear) {
        this.overlayRef.dispose();
      }
      this.overlayRef = null;
      this.closeSubscription.unsubscribe();
    }
  }

  private getScrollStrategy(config: ContextMenuServiceConfig): ScrollStrategy {
    if(config.scrollStrategy === 'close') {
      return this.overlay.scrollStrategies.close();
    }

    if(config.scrollStrategy === 'block') {
      return this.overlay.scrollStrategies.block();
    }

    return this.overlay.scrollStrategies.noop();
  }
}
