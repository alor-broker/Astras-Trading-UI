import {Component, EnvironmentInjector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Overlay} from '@angular/cdk/overlay';
import {NavigationStart, Router} from '@angular/router';
import {firstValueFrom, Subject, take} from 'rxjs';
import {FloatingWindowTestingHelper, FloatingWindowOverlayTestContext} from '@testing-lib/helpers/floating-window-testing.helper';
import {FloatingWindowService} from './floating-window.service';
import {FloatingWindowAction, FloatingWindowOpenOptions, FloatingWindowPolicy} from '../types/floating-window.types';

@Component({selector: 'ats-window-test-content', template: ''})
class WindowTestContent {}

describe('FloatingWindowService', () => {
  let service: FloatingWindowService;
  let overlay: FloatingWindowOverlayTestContext;
  let config: FloatingWindowOpenOptions<string>;
  let ownerInjector: EnvironmentInjector;
  let navigation$: Subject<NavigationStart>;

  beforeEach(() => {
    overlay = FloatingWindowTestingHelper.createOverlay();
    navigation$ = new Subject<NavigationStart>();
    TestBed.configureTestingModule({providers: [
      {provide: Overlay, useValue: overlay.overlay},
      {provide: Router, useValue: {events: navigation$}}
    ]});
    service = TestBed.inject(FloatingWindowService);
    const owner = FloatingWindowTestingHelper.createOwner();
    ownerInjector = owner.injector;
    config = {...owner, data: 'first'};
  });

  afterEach(() => {
    service.closeAll();
    ownerInjector.destroy();
    navigation$.complete();
  });

  it('should allow multiple windows by default without a backdrop or scroll blocking', () => {
    const first = service.open(WindowTestContent, config);
    const second = service.open(WindowTestContent, config);

    expect(first).not.toBe(second);
    expect(first?.groupId).toBe('common');
    expect(overlay.configs).toHaveLength(2);
    expect(overlay.configs[0].hasBackdrop).toBe(false);
  });

  it.each([
    [FloatingWindowPolicy.OneOverall, FloatingWindowPolicy.Multiple, 'other'],
    [FloatingWindowPolicy.Multiple, FloatingWindowPolicy.OneOverall, 'other'],
    [FloatingWindowPolicy.OnePerGroup, FloatingWindowPolicy.Multiple, 'common'],
    [FloatingWindowPolicy.Multiple, FloatingWindowPolicy.OnePerGroup, 'common']
  ])('should enforce both existing and requested restrictions (%s, %s, %s)', (firstPolicy, nextPolicy, nextGroup) => {
    const first = service.open(WindowTestContent, {...config, policy: firstPolicy});
    const activated = vi.fn();
    first?.activated$.pipe(take(2)).subscribe(activated);

    expect(service.open(WindowTestContent, {...config, data: 'replacement', policy: nextPolicy, groupId: nextGroup})).toBeNull();
    expect(service.open(WindowTestContent, {...config, policy: nextPolicy, groupId: nextGroup})).toBeNull();

    expect(activated).toHaveBeenCalledTimes(2);
    expect(first?.data()).toBe('first');
    expect(overlay.created).toHaveLength(1);
  });

  it('should allow single windows from different groups', () => {
    service.open(WindowTestContent, {...config, policy: FloatingWindowPolicy.OnePerGroup});
    expect(service.open(WindowTestContent, {...config, groupId: 'other', policy: FloatingWindowPolicy.OnePerGroup})).not.toBeNull();
  });

  it('should activate the last active conflicting window and preserve later modal layers', () => {
    const first = service.open(WindowTestContent, config);
    service.open(WindowTestContent, config);
    const modal = document.createElement('div');
    document.body.appendChild(modal);
    first?.activate();
    const activation = vi.fn();
    first?.activated$.pipe(take(1)).subscribe(activation);

    service.open(WindowTestContent, {...config, policy: FloatingWindowPolicy.OneOverall});

    expect(activation).toHaveBeenCalledOnce();
    expect(overlay.created[0].host.nextElementSibling).toBe(modal);
    modal.remove();
  });

  it('should reject duplicate ids even when multiple windows are allowed', () => {
    const first = service.open(WindowTestContent, {...config, id: 'details'});
    expect(service.open(WindowTestContent, {...config, id: 'details', groupId: 'other'})).toBeNull();
    expect(service.get('details')).toBe(first);
  });

  it('should transfer ownership and dispose only when the new owner is destroyed', () => {
    const next = FloatingWindowTestingHelper.createOwner();
    const ref = service.open(WindowTestContent, {...config, id: 'details'});
    ref?.setOwner(next.owner);
    ownerInjector.destroy();
    expect(ref?.closed()).toBe(false);
    next.injector.destroy();
    expect(ref?.closed()).toBe(true);
    expect(service.get('details')).toBeNull();
    // The afterEach hook owns a fresh injector because the original has already been destroyed.
    ownerInjector = FloatingWindowTestingHelper.createOwner().injector;
  });

  it('should close with a result once, complete streams and remove the registry entry', async () => {
    const ref = service.open<string, number>(WindowTestContent, {
      data: 'first', injector: config.injector, owner: config.owner, id: 'details'
    });
    if (ref == null) {
      throw new Error('Window should open');
    }
    const result = firstValueFrom(ref.afterClosed$);
    const completed = vi.fn();
    ref.afterOpened$.subscribe({complete: completed});

    ref.close(42);
    ref.close(99);

    expect(await result).toBe(42);
    expect(completed).toHaveBeenCalledOnce();
    expect(overlay.created[0].ref.dispose).toHaveBeenCalledOnce();
    expect(service.get('details')).toBeNull();
  });

  it('should keep a window open for async vetoes, prevent duplicate actions and report failures', async () => {
    let finish: (result: boolean) => void = () => {};
    const onOk = vi.fn(() => new Promise<boolean>(resolve => {
      finish = resolve;
    }));
    const ref = service.open(WindowTestContent, {...config, onOk});
    const pending = ref?.requestAction(FloatingWindowAction.Ok);
    await ref?.requestAction(FloatingWindowAction.Ok);
    expect(onOk).toHaveBeenCalledOnce();
    finish(false);
    await pending;
    expect(ref?.closed()).toBe(false);
    const errors = vi.fn();
    ref?.actionErrors$.pipe(take(1)).subscribe(errors);
    ref?.update({onCancel: () => {
      throw new Error('failed');
    }});
    await ref?.requestAction(FloatingWindowAction.Cancel);
    expect(errors).toHaveBeenCalledOnce();
    expect(ref?.pending()).toBeNull();
    expect(ref?.closed()).toBe(false);
    ref?.update({onCancel: () => true});
    await ref?.requestAction(FloatingWindowAction.Cancel);
    expect(ref?.closed()).toBe(true);
  });

  it('should ignore disabled and loading actions', async () => {
    const onOk = vi.fn();
    const ref = service.open(WindowTestContent, {...config, onOk, okDisabled: true});
    await ref?.requestAction(FloatingWindowAction.Ok);
    ref?.update({okDisabled: false, okLoading: true});
    await ref?.requestAction(FloatingWindowAction.Ok);
    expect(onOk).not.toHaveBeenCalled();
    expect(ref?.closed()).toBe(false);
  });

  it('should close only for an unhandled Escape with focus inside the window', async () => {
    const ref = service.open(WindowTestContent, config);
    const input = document.createElement('input');
    overlay.created[0].host.appendChild(input);
    overlay.created[0].keys$.next(new KeyboardEvent('keydown', {key: 'Escape'}));
    await Promise.resolve();
    expect(ref?.closed()).toBe(false);
    input.focus();
    const handled = new KeyboardEvent('keydown', {key: 'Escape', cancelable: true});
    handled.preventDefault();
    overlay.created[0].keys$.next(handled);
    await Promise.resolve();
    expect(ref?.closed()).toBe(false);
    overlay.created[0].keys$.next(new KeyboardEvent('keydown', {key: 'Escape'}));
    await Promise.resolve();
    expect(ref?.closed()).toBe(true);
  });

  it('should clean up windows on navigation and allow opening them again', () => {
    const ref = service.open(WindowTestContent, {...config, id: 'details'});
    navigation$.next(new NavigationStart(1, '/next'));
    expect(ref?.closed()).toBe(true);
    expect(service.open(WindowTestContent, {...config, id: 'details'})).not.toBeNull();
  });

  it('should restore the opener focus only when focus was inside the closing window', () => {
    const opener = document.createElement('button');
    const outside = document.createElement('input');
    document.body.append(opener, outside);
    opener.focus();
    const ref = service.open(WindowTestContent, config);
    const inside = document.createElement('input');
    overlay.created[0].host.appendChild(inside);
    inside.focus();

    ref?.close();

    expect(document.activeElement).toBe(opener);
    const next = service.open(WindowTestContent, config);
    outside.focus();
    next?.close();
    expect(document.activeElement).toBe(outside);
    opener.remove();
    outside.remove();
  });
});
