import {ChangeDetectionStrategy, Component, ElementRef, input, model, output, viewChild, ViewEncapsulation} from '@angular/core';
import {CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition} from '@angular/cdk/overlay';
import {CdkTrapFocus} from '@angular/cdk/a11y';
import {NzIconModule} from 'ng-zorro-antd/icon';
import {GalleryWidget} from '../../utils/widgets-gallery.helper';
import {WidgetsGalleryList} from '../widgets-gallery-list/widgets-gallery-list';

@Component({
  selector: 'ats-widgets-gallery-submenu',
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, CdkTrapFocus, NzIconModule, WidgetsGalleryList],
  templateUrl: './widgets-gallery-submenu.html',
  styleUrl: './widgets-gallery-submenu.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class WidgetsGallerySubmenu {
  readonly label = input.required<string>();
  readonly widgets = input.required<GalleryWidget[]>();
  readonly categories = input(false);
  readonly disabled = input(false);
  readonly highlighted = input(false);
  readonly prominent = input(false);
  readonly showNewBadge = input(true);
  readonly opened = model(false);
  readonly selected = output<string>();
  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');
  readonly positions: ConnectedPosition[] = [
    {originX: 'end', originY: 'top', overlayX: 'start', overlayY: 'top', offsetX: 8},
    {originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top', offsetX: -8}
  ];

  openFromKeyboard(event: Event): void {
    event.preventDefault();
    this.opened.set(true);
  }

  focusFirst(): void {
    this.panel()?.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
  }

  close(): void {
    this.opened.set(false);
    this.trigger().nativeElement.focus();
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'ArrowLeft') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    const buttons = Array.from(this.panel()?.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const index = buttons.findIndex(button => button === event.target);
    if (index < 0 || buttons.length === 0) {
      return;
    }
    let next: number;
    if (event.key === 'ArrowDown') {
      next = (index + 1) % buttons.length;
    } else if (event.key === 'ArrowUp') {
      next = (index + buttons.length - 1) % buttons.length;
    } else if (event.key === 'Home') {
      next = 0;
    } else if (event.key === 'End') {
      next = buttons.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    buttons[next].focus();
  }
}
