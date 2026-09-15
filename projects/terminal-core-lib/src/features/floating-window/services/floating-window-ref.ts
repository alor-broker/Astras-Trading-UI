import {computed, DestroyRef, inject, InjectionToken, signal} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {FloatingWindowAction, FloatingWindowContent, FloatingWindowOpenOptions, FloatingWindowOptions,
  FloatingWindowPolicy} from '../types/floating-window.types';

/** Owns one window's transient state. Only the registry has application lifetime. */
export class FloatingWindowRef<D = unknown, R = unknown> {
  private readonly optionsState;
  readonly options;
  readonly data;
  private readonly pendingState = signal<FloatingWindowAction | null>(null);
  private readonly ownerState = signal<DestroyRef | null>(null);
  private readonly closedState = signal(false);
  readonly pending = this.pendingState.asReadonly();
  readonly owner = this.ownerState.asReadonly();
  readonly closed = this.closedState.asReadonly();
  private readonly opened$ = new ReplaySubject<void>(1);
  private readonly closed$ = new ReplaySubject<R | undefined>(1);
  private readonly errors$ = new Subject<unknown>();
  private readonly activation$ = new Subject<void>();
  readonly afterOpened$ = this.opened$.asObservable();
  readonly afterClosed$ = this.closed$.asObservable();
  readonly actionErrors$ = this.errors$.asObservable();
  readonly activated$ = this.activation$.asObservable();
  readonly id: string | undefined;
  readonly groupId: string;
  readonly policy: FloatingWindowPolicy;
  private unregisterOwner: (() => void) | null = null;
  private dispose: (() => void) | null = null;
  private raise: (() => void) | null = null;
  private opened = false;

  constructor(readonly content: FloatingWindowContent<D, R>, options: FloatingWindowOptions<D, R>,
              identity: Pick<FloatingWindowOpenOptions<D, R>, 'id' | 'groupId' | 'policy'> = {}) {
    this.id = identity.id;
    this.groupId = identity.groupId ?? 'common';
    this.policy = identity.policy ?? FloatingWindowPolicy.Multiple;
    this.optionsState = signal<FloatingWindowOptions<D, R>>(options);
    this.options = this.optionsState.asReadonly();
    this.data = computed(() => this.options().data);
  }

  /** Called by the overlay service before publishing the reference. */
  attach(dispose: () => void, raise: () => void, owner: DestroyRef): void {
    this.dispose = dispose;
    this.raise = raise;
    this.setOwner(owner);
  }

  /** Called by the surface after its first visible render. */
  notifyOpened(): void {
    if (!this.closed() && !this.opened) {
      this.opened = true;
      this.opened$.next();
    }
  }

  setOwner(owner: DestroyRef): void {
    if (this.closed()) {
      return;
    }
    this.unregisterOwner?.();
    this.ownerState.set(owner);
    if (owner.destroyed) {
      this.close();
      return;
    }
    this.unregisterOwner = owner.onDestroy(() => this.close());
  }

  update(options: Partial<FloatingWindowOptions<D, R>>): void {
    if (!this.closed()) {
      this.optionsState.update(current => ({...current, ...options}));
    }
  }

  activate(): void {
    if (!this.closed()) {
      this.raise?.();
      this.activation$.next();
    }
  }

  bringToFront(): void {
    if (!this.closed()) {
      this.raise?.();
    }
  }

  async requestAction(action: FloatingWindowAction): Promise<void> {
    const options = this.options();
    const disabled = action === FloatingWindowAction.Ok
      ? options.okDisabled === true || options.okLoading === true
      : options.cancelDisabled === true || options.cancelLoading === true;
    if (this.closed() || this.pending() != null || disabled) {
      return;
    }
    this.pendingState.set(action);
    try {
      const handler = action === FloatingWindowAction.Ok ? options.onOk : options.onCancel;
      if (await handler?.(this) !== false && !this.closed()) {
        this.close();
      }
    } catch (error: unknown) {
      if (!this.closed()) {
        this.errors$.next(error);
      }
    } finally {
      this.pendingState.set(null);
    }
  }

  close(result?: R): void {
    if (this.closed()) {
      return;
    }
    this.closedState.set(true);
    this.unregisterOwner?.();
    this.unregisterOwner = null;
    this.ownerState.set(null);
    this.dispose?.();
    this.dispose = null;
    this.raise = null;
    this.closed$.next(result);
    this.closed$.complete();
    this.opened$.complete();
    this.activation$.complete();
    this.errors$.complete();
  }
}

export const FLOATING_WINDOW_REF = new InjectionToken<FloatingWindowRef>('FloatingWindowRef');

/** The content and caller must agree on the data/result types for this window. */
export function injectFloatingWindowRef<D = unknown, R = unknown>(): FloatingWindowRef<D, R> {
  return inject(FLOATING_WINDOW_REF) as unknown as FloatingWindowRef<D, R>;
}
