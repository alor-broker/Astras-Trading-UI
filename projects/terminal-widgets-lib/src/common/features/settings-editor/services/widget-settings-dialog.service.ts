import {
  inject,
  Injectable
} from '@angular/core';
import {
  ConnectionPositionPair,
  Overlay,
  OverlayRef
} from '@angular/cdk/overlay';
import {TemplatePortal} from '@angular/cdk/portal';
import {
  FocusTrap,
  FocusTrapFactory
} from '@angular/cdk/a11y';
import {ESCAPE} from '@angular/cdk/keycodes';
import {
  filter,
  Subscription
} from 'rxjs';
import {
  WidgetSettingsDialogConfig,
  WidgetSettingsDialogHandle
} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-dialog.types';

const positions: ConnectionPositionPair[] = [
  new ConnectionPositionPair({originX: 'end', originY: 'bottom'}, {overlayX: 'end', overlayY: 'top'}),
  new ConnectionPositionPair({originX: 'start', originY: 'bottom'}, {overlayX: 'start', overlayY: 'top'}),
  new ConnectionPositionPair({originX: 'end', originY: 'top'}, {overlayX: 'end', overlayY: 'bottom'}),
  new ConnectionPositionPair({originX: 'start', originY: 'top'}, {overlayX: 'start', overlayY: 'bottom'})
];

/**
 * Opens the widget settings editor on desktop as a modal dialog positioned next
 * to the trigger button (CDK overlay). The backdrop blocks the background but a
 * click on it does NOT close the dialog; closing happens only via the editor
 * buttons (Cancel/Save) and the Escape key.
 *
 * Not used on mobile, where the editor stays inline inside the widget.
 */
@Injectable({providedIn: 'root'})
export class WidgetSettingsDialogService {
  private readonly overlay = inject(Overlay);

  private readonly focusTrapFactory = inject(FocusTrapFactory);

  private overlayRef: OverlayRef | null = null;

  private focusTrap: FocusTrap | null = null;

  private keydownSubscription = Subscription.EMPTY;

  private previouslyFocused: HTMLElement | null = null;

  private afterClosed: (() => void) | null = null;

  private highlightedWidget: Element | null = null;

  open(config: WidgetSettingsDialogConfig): WidgetSettingsDialogHandle {
    this.close();

    this.previouslyFocused = config.trigger;
    this.afterClosed = config.afterClosed ?? null;

    // Highlight the widget being edited so it is clear which widget the dialog belongs to.
    this.highlightedWidget = config.trigger.closest('ats-widget-skeleton');
    this.highlightedWidget?.classList.add('ats-widget-settings-active');

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(config.trigger)
      .withPositions(positions)
      .withPush(true)
      .withFlexibleDimensions(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'ats-widget-settings-dialog-backdrop',
      panelClass: 'ats-widget-settings-dialog-panel',
      disposeOnNavigation: true
    });

    this.keydownSubscription = this.overlayRef
      .keydownEvents()
      .pipe(filter(event => event.keyCode === ESCAPE))
      .subscribe(event => {
        event.preventDefault();
        this.close();
      });

    this.overlayRef.attach(new TemplatePortal(config.contentTpl, config.viewContainerRef));

    this.focusTrap = this.focusTrapFactory.create(this.overlayRef.overlayElement);
    this.focusTrap.focusInitialElementWhenReady();

    return {close: (): void => this.close()};
  }

  close(): void {
    this.keydownSubscription.unsubscribe();
    this.keydownSubscription = Subscription.EMPTY;

    this.focusTrap?.destroy();
    this.focusTrap = null;

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    this.highlightedWidget?.classList.remove('ats-widget-settings-active');
    this.highlightedWidget = null;

    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
      this.previouslyFocused = null;
    }

    const afterClosed = this.afterClosed;
    this.afterClosed = null;
    afterClosed?.();
  }
}
