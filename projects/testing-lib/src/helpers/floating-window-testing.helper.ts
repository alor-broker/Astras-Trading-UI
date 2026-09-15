import {createEnvironmentInjector, DestroyRef, EnvironmentInjector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {GlobalPositionStrategy, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {Subject} from 'rxjs';
import {vi} from 'vitest';

export interface FloatingWindowOverlayStub {
  ref: OverlayRef;
  host: HTMLElement;
  keys$: Subject<KeyboardEvent>;
}

export interface FloatingWindowOverlayTestContext {
  overlay: Pick<Overlay, 'create' | 'position' | 'scrollStrategies'>;
  created: FloatingWindowOverlayStub[];
  configs: OverlayConfig[];
}

/** Real owners with deterministic overlay stubs: service tests do not instantiate animated UI. */
export class FloatingWindowTestingHelper {
  static createOwner(): {injector: EnvironmentInjector, owner: DestroyRef} {
    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    return {injector, owner: injector.get(DestroyRef)};
  }

  static createOverlay(): FloatingWindowOverlayTestContext {
    const created: FloatingWindowOverlayStub[] = [];
    const configs: OverlayConfig[] = [];
    const create = vi.fn((config: OverlayConfig = {}): OverlayRef => {
      configs.push(config);
      const detached$ = new Subject<void>();
      const keys$ = new Subject<KeyboardEvent>();
      const host = document.createElement('div');
      document.body.appendChild(host);
      const ref = {
        hostElement: host,
        overlayElement: host,
        attach: vi.fn(),
        detachments: () => detached$.asObservable(),
        keydownEvents: () => keys$.asObservable(),
        dispose: vi.fn(() => {
          host.remove();
          detached$.next();
          detached$.complete();
          keys$.complete();
        })
      } as unknown as OverlayRef;
      created.push({ref, host, keys$});
      return ref;
    });
    const overlay = {
      create,
      position: (): ReturnType<Overlay['position']> => ({global: () => new GlobalPositionStrategy()}) as ReturnType<Overlay['position']>,
      scrollStrategies: {noop: () => ({enable: vi.fn(), disable: vi.fn(), attach: vi.fn()})} as unknown as Overlay['scrollStrategies']
    };
    return {overlay, created, configs};
  }
}
