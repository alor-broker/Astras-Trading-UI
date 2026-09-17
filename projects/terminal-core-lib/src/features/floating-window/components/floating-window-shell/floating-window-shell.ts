import {DOCUMENT, NgComponentOutlet, NgTemplateOutlet} from '@angular/common';
import {afterNextRender, afterRenderEffect, ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef,
  inject, Injector, signal, TemplateRef, untracked, viewChild, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {fromEvent} from 'rxjs';
import {FloatingWindowGeometryHelper, FloatingWindowBounds} from '../../utils/floating-window-geometry.helper';
import {injectFloatingWindowRef} from '../../services/floating-window-ref';
import {FloatingWindowAction, FloatingWindowEdge, FloatingWindowRect} from '../../types/floating-window.types';

@Component({
  selector: 'ats-floating-window-shell',
  imports: [NgComponentOutlet, NgTemplateOutlet, TranslocoDirective, NzButtonComponent],
  templateUrl: './floating-window-shell.html',
  styleUrl: './floating-window-shell.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'options().panelClass ?? ""',
    '[class.full-screen]': 'options().fullScreen === true',
    '[class.highlighted]': 'highlighted() && options().highlightOnActivate !== false',
    '[style.left.px]': 'rect()?.x ?? 0',
    '[style.top.px]': 'rect()?.y ?? 0',
    '[style.width]': 'width()',
    '[style.height]': 'height()',
    '[style.min-width]': 'minWidth()',
    '[style.min-height]': 'minHeight()',
    '[style.max-width]': 'maxWidth()',
    '[style.max-height]': 'maxHeight()',
    '[style.visibility]': 'rect() == null ? "hidden" : "visible"',
    '(pointerdown)': 'onInteraction()',
    '(keydown)': 'onInteraction()',
    '(focusin)': 'ref.bringToFront()',
    'role': 'dialog',
    'tabindex': '-1',
    '[attr.aria-label]': 'options().ariaLabel ?? null',
    '[attr.aria-labelledby]': 'options().ariaLabel == null ? titleId : null'
  }
})
export class FloatingWindowShell {
  protected readonly ref = injectFloatingWindowRef();
  protected readonly options = this.ref.options;
  protected readonly injector = inject(Injector);
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly viewport = signal({width: this.document.documentElement.clientWidth, height: this.document.documentElement.clientHeight});
  private readonly destroyRef = inject(DestroyRef);
  private static nextId = 0;
  protected readonly titleId = `ats-floating-window-title-${FloatingWindowShell.nextId++}`;
  protected readonly actions = FloatingWindowAction;
  protected readonly edges = Object.values(FloatingWindowEdge);
  protected readonly rect = signal<FloatingWindowRect | null>(null);
  protected readonly highlighted = signal(false);
  private readonly resized = signal<{width: number, height: number} | null>(null);
  private highlightTimer: ReturnType<typeof setTimeout> | null = null;
  private stopGesture: (() => void) | null = null;
  private observer: ResizeObserver | null = null;
  private openingAnimation: Animation | null = null;
  private positionPinned = false;
  private opened = false;
  private wasFullScreen = false;
  private desktopRect: FloatingWindowRect | null = null;
  private previousData = this.ref.data();
  private readonly header = viewChild<ElementRef<HTMLElement>>('header');
  protected readonly titleTemplate = computed(() => {
    const title = this.options().title;
    return title instanceof TemplateRef ? title : null;
  });

  protected readonly titleText = computed(() => typeof this.options().title === 'string' ? this.options().title : '');
  protected readonly contentTemplate = this.ref.content instanceof TemplateRef ? this.ref.content : null;
  protected readonly contentComponent = this.ref.content instanceof TemplateRef ? null : this.ref.content;
  protected readonly context = computed(() => ({$implicit: this.ref.data(), window: this.ref}));
  protected readonly width = computed(() => this.options().fullScreen === true
    ? `${this.viewport().width}px`
    : this.cssSize(this.resized()?.width ?? this.options().width, '520px'));

  protected readonly height = computed(() => this.options().fullScreen === true
    ? `${this.viewport().height}px`
    : this.cssSize(this.resized()?.height ?? this.options().height, 'auto'));

  protected readonly minWidth = computed(() => `min(${this.cssSize(this.options().minWidth, '280px')}, ${this.maxWidth()})`);
  protected readonly minHeight = computed(() => `min(${this.cssSize(this.options().minHeight, '160px')}, ${this.maxHeight()})`);
  protected readonly maxWidth = computed(() => this.options().fullScreen === true
    ? `${this.viewport().width}px`
    : `min(${this.cssSize(this.options().maxWidth, '100%')}, ${Math.max(1, this.viewport().width - 16)}px)`);

  protected readonly maxHeight = computed(() => this.options().fullScreen === true
    ? `${this.viewport().height}px`
    : `min(${this.cssSize(this.options().maxHeight, '100%')}, ${Math.max(1, this.viewport().height - 16)}px)`);

  constructor() {
    afterNextRender(() => {
      this.layout();
      this.observer = new ResizeObserver(() => this.layout());
      this.observer.observe(this.element);
    });
    afterRenderEffect(() => {
      if (this.header() != null && this.rect() != null && !this.opened) {
        this.opened = true;
        this.element.focus({preventScroll: true});
        this.animateOpening();
      }
    });
    effect(() => {
      // Explicit dimension updates reset a previous manual resize; data/title updates do not.
      const options = this.options();
      const dimensions = [options.width, options.height];
      untracked(() => this.updatePresentation(dimensions, options.data));
    });
    this.ref.activated$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.element.focus({preventScroll: true});
      if (this.options().highlightOnActivate === false) {
        return;
      }
      this.highlighted.set(true);
      for (const animation of this.element.getAnimations()) {
        if (animation instanceof CSSAnimation && animation.animationName === 'ats-floating-window-highlight') {
          animation.currentTime = 0;
          animation.play();
        }
      }
      if (this.highlightTimer != null) {
        clearTimeout(this.highlightTimer);
      }
      this.highlightTimer = setTimeout(() => this.highlighted.set(false), 900);
    });
    const window = this.document.defaultView;
    if (window != null) {
      fromEvent(window, 'resize').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.stopGesture?.();
        this.layout();
      });
    }
    this.destroyRef.onDestroy(() => {
      this.stopGesture?.();
      this.observer?.disconnect();
      this.openingAnimation?.cancel();
      if (this.highlightTimer != null) {
        clearTimeout(this.highlightTimer);
      }
    });
  }

  private previousDimensions: unknown[] = [];

  private animateOpening(): void {
    if (this.document.defaultView?.matchMedia('(prefers-reduced-motion: reduce)').matches === true) {
      this.ref.notifyOpened();
      return;
    }
    // Match nz-modal's zoom-in motion without depending on its CSS classes.
    this.openingAnimation = this.element.animate([
      {opacity: 0, transform: 'scale(0.2)'},
      {opacity: 1, transform: 'scale(1)'}
    ], {duration: 200, easing: 'cubic-bezier(0.08, 0.82, 0.17, 1)'});
    void this.openingAnimation.finished.then(() => {
      this.openingAnimation = null;
      this.ref.notifyOpened();
    }, () => {});
  }

  protected onInteraction(): void {
    this.openingAnimation?.finish();
    this.positionPinned = true;
    this.ref.bringToFront();
  }

  private updatePresentation(dimensions: unknown[], data: unknown): void {
    const dimensionsChanged = dimensions.some((value, index) => value !== this.previousDimensions[index]);
    const dataChanged = data !== this.previousData;
    if (dimensionsChanged) {
      this.resized.set(null);
    } else if (dataChanged && this.options().fullScreen !== true) {
      const rect = this.rect();
      if (rect != null) {
        this.resized.set({width: rect.width, height: rect.height});
      }
    }
    if (dataChanged) {
      this.positionPinned = true;
    }
    this.previousDimensions = dimensions;
    this.previousData = data;
  }

  protected startMove(event: PointerEvent): void {
    if (this.options().draggable === false || this.options().fullScreen === true
      || (event.target instanceof Element && event.target.closest('button, a, input, select, textarea, [contenteditable], [role="button"]') != null)) {
      return;
    }
    this.startGesture(event);
  }

  protected startResize(event: PointerEvent, edge: FloatingWindowEdge): void {
    if (this.options().resizable === true && this.options().fullScreen !== true) {
      this.startGesture(event, edge);
    }
  }

  private startGesture(event: PointerEvent, edge?: FloatingWindowEdge): void {
    const rect = this.rect();
    if (event.button !== 0 || rect == null || !(event.currentTarget instanceof HTMLElement)) {
      return;
    }
    event.preventDefault();
    this.stopGesture?.();
    const target = event.currentTarget;
    target.focus({preventScroll: true});
    const bounds = this.bounds();
    const move = (next: PointerEvent): void => {
      if (next.pointerId !== event.pointerId) {
        return;
      }
      const delta = {x: next.clientX - event.clientX, y: next.clientY - event.clientY};
      this.applyRect(edge == null
        ? FloatingWindowGeometryHelper.constrain({...rect, x: rect.x + delta.x, y: rect.y + delta.y}, bounds)
        : FloatingWindowGeometryHelper.resize(rect, edge, delta, bounds), edge != null);
    };
    const end = (next: PointerEvent): void => {
      if (next.pointerId === event.pointerId) {
        this.stopGesture?.();
      }
    };
    this.stopGesture = (): void => {
      target.removeEventListener('pointermove', move);
      target.removeEventListener('pointerup', end);
      target.removeEventListener('pointercancel', end);
      target.removeEventListener('lostpointercapture', end);
      if (target.hasPointerCapture(event.pointerId)) {
        target.releasePointerCapture(event.pointerId);
      }
      this.stopGesture = null;
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', end);
    target.addEventListener('lostpointercapture', end);
    target.setPointerCapture(event.pointerId);
  }

  protected onGeometryKey(event: KeyboardEvent, edge?: FloatingWindowEdge): void {
    if (event.target !== event.currentTarget || this.options().fullScreen === true
      || (edge == null ? this.options().draggable === false : this.options().resizable !== true)) {
      return;
    }
    const rect = this.rect();
    const step = event.shiftKey ? 1 : 10;
    const delta = {x: event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
      y: event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0};
    if (rect == null || (delta.x === 0 && delta.y === 0)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.applyRect(edge == null
      ? FloatingWindowGeometryHelper.constrain({...rect, x: rect.x + delta.x, y: rect.y + delta.y}, this.bounds())
      : FloatingWindowGeometryHelper.resize(rect, edge, delta, this.bounds()), edge != null);
  }

  private layout(): void {
    const viewport = this.document.documentElement;
    if (viewport.clientWidth !== this.viewport().width || viewport.clientHeight !== this.viewport().height) {
      this.viewport.set({width: viewport.clientWidth, height: viewport.clientHeight});
    }
    // Animated transforms must not change the dimensions used for positioning.
    const style = getComputedStyle(this.element);
    const actual = {width: Number.parseFloat(style.width), height: Number.parseFloat(style.height)};
    const bounds = this.bounds();
    const options = this.options();
    const current = this.rect();
    if (options.fullScreen === true && !this.wasFullScreen) {
      this.desktopRect = current;
    }
    const previous = options.fullScreen !== true && this.wasFullScreen ? this.desktopRect : current;
    this.wasFullScreen = options.fullScreen === true;
    const next = options.fullScreen === true
? {x: 0, y: 0, width: bounds.width, height: bounds.height}
      : previous == null || !this.positionPinned
? FloatingWindowGeometryHelper.initial(actual, bounds, options.origin,
        {x: options.offsetX ?? 0, y: options.offsetY ?? 0})
      : FloatingWindowGeometryHelper.constrain({...previous, width: actual.width, height: actual.height}, bounds);
    if (current == null || Object.keys(next).some(key => next[key as keyof FloatingWindowRect] !== current[key as keyof FloatingWindowRect])) {
      this.rect.set(next);
    }
  }

  private applyRect(rect: FloatingWindowRect, resize: boolean): void {
    this.positionPinned = true;
    if (resize) {
      this.resized.set({width: rect.width, height: rect.height});
    }
    this.rect.set(rect);
  }

  private bounds(): FloatingWindowBounds {
    const viewport = this.document.documentElement;
    return {width: viewport.clientWidth, height: viewport.clientHeight,
      margin: this.options().fullScreen === true ? 0 : 8,
      minWidth: this.measure(this.minWidth(), false), minHeight: this.measure(this.minHeight(), true),
      maxWidth: this.measure(this.maxWidth(), false), maxHeight: this.measure(this.maxHeight(), true)};
  }

  /** Let CSS resolve calc(), viewport units and percentages instead of parsing CSS in TypeScript. */
  private measure(size: string, height: boolean): number {
    const probe = this.document.createElement('div');
    probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;height:0;';
    if (height) {
      probe.style.height = size;
    } else {
      probe.style.width = size;
    }
    // Keep percentage resolution independent of the animated window's containing block.
    this.document.body.appendChild(probe);
    const value = height ? probe.getBoundingClientRect().height : probe.getBoundingClientRect().width;
    probe.remove();
    return value;
  }

  private cssSize(value: string | number | undefined, fallback: string): string {
    return typeof value === 'number'
? Number.isFinite(value) && value > 0 ? `${value}px` : fallback
      : value ?? fallback;
  }
}
