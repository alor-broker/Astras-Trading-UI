import {ComponentPortal} from '@angular/cdk/portal';
import {Overlay, OverlayRef} from '@angular/cdk/overlay';
import {DestroyRef, inject, Injectable, Injector} from '@angular/core';
import {NavigationStart, Router} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter, takeUntil} from 'rxjs';
import {FloatingWindowShell} from '../components/floating-window-shell/floating-window-shell';
import {FLOATING_WINDOW_REF, FloatingWindowRef} from './floating-window-ref';
import {FloatingWindowAction, FloatingWindowContent, FloatingWindowOpenOptions, FloatingWindowPolicy} from '../types/floating-window.types';

@Injectable({providedIn: 'root'})
export class FloatingWindowService {
  private readonly overlay = inject(Overlay);
  private readonly destroyRef = inject(DestroyRef);
  private readonly windows = new Map<FloatingWindowRef, OverlayRef>();

  constructor() {
    inject(Router, {optional: true})?.events.pipe(
      filter(event => event instanceof NavigationStart),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.closeAll());
    this.destroyRef.onDestroy(() => this.closeAll());
  }

  /** Null means an existing conflicting window was activated; no content was created. */
  open<D, R = unknown>(content: FloatingWindowContent<D, R>, config: FloatingWindowOpenOptions<D, R>): FloatingWindowRef<D, R> | null {
    if (config.owner.destroyed) {
      return null;
    }
    const group = config.groupId ?? 'common';
    const policy = config.policy ?? FloatingWindowPolicy.Multiple;
    const conflict = [...this.windows.keys()].reverse().find(existing =>
      (config.id != null && existing.id === config.id)
      || existing.policy === FloatingWindowPolicy.OneOverall || policy === FloatingWindowPolicy.OneOverall
      || (existing.groupId === group
        && (existing.policy === FloatingWindowPolicy.OnePerGroup || policy === FloatingWindowPolicy.OnePerGroup)));
    if (conflict != null) {
      conflict.activate();
      return null;
    }

    const {injector, owner, id, groupId, policy: openPolicy, ...options} = config;
    const ref = new FloatingWindowRef(content, options, {id, groupId, policy: openPolicy});
    const registryRef = ref as unknown as FloatingWindowRef;
    const overlayRef: OverlayRef = this.overlay.create({
      hasBackdrop: false,
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      positionStrategy: this.overlay.position().global().top('0').left('0'),
      panelClass: 'ats-floating-window-overlay',
      eventPredicate: event => overlayRef.overlayElement.contains(event.target as Node)
    });
    this.windows.set(registryRef, overlayRef);
    const document = overlayRef.overlayElement.ownerDocument;
    const previousFocus = document.activeElement;
    ref.attach(() => {
      const restoreFocus = overlayRef.overlayElement.contains(document.activeElement);
      this.windows.delete(registryRef);
      overlayRef.dispose();
      if (restoreFocus && previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({preventScroll: true});
      }
    }, () => this.raise(registryRef), owner);
    overlayRef.detachments().pipe(takeUntil(ref.afterClosed$)).subscribe(() => ref.close());
    overlayRef.keydownEvents().pipe(takeUntil(ref.afterClosed$)).subscribe(event => {
      const current = ref.options();
      if (event.key === 'Escape' && !event.defaultPrevented && current.keyboard !== false
        && current.closable !== false && overlayRef.overlayElement.contains(overlayRef.overlayElement.ownerDocument.activeElement)) {
        event.preventDefault();
        event.stopPropagation();
        void ref.requestAction(FloatingWindowAction.Cancel);
      }
    });
    try {
      overlayRef.attach(new ComponentPortal(FloatingWindowShell, null, Injector.create({
        parent: injector,
        providers: [{provide: FLOATING_WINDOW_REF, useValue: ref}]
      })));
      // Keep floating windows below overlays such as modal masks and dropdowns.
      const parent = overlayRef.hostElement.parentElement;
      const firstOther = parent == null
? null
: [...parent.children].find(child =>
        child !== overlayRef.hostElement && ![...this.windows.values()].some(item => item.hostElement === child));
      if (firstOther != null) {
        parent?.insertBefore(overlayRef.hostElement, firstOther);
      }
      return ref;
    } catch (error: unknown) {
      ref.close();
      throw error;
    }
  }

  /** Use the same data/result contract as the original open call for this id. */
  get<D = unknown, R = unknown>(id: string): FloatingWindowRef<D, R> | null {
    return ([...this.windows.keys()].find(ref => ref.id === id) ?? null) as unknown as FloatingWindowRef<D, R> | null;
  }

  closeAll(): void {
    for (const ref of [...this.windows.keys()]) {
      ref.close();
    }
  }

  private raise(ref: FloatingWindowRef): void {
    const overlay = this.windows.get(ref);
    if (overlay == null) {
      return;
    }
    const last = [...this.windows.values()].at(-1);
    if (last != null && last !== overlay) {
      last.hostElement.after(overlay.hostElement);
    }
    this.windows.delete(ref);
    this.windows.set(ref, overlay);
  }
}
