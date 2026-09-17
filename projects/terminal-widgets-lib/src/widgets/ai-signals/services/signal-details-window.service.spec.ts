import {createEnvironmentInjector, EnvironmentInjector} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {Overlay} from '@angular/cdk/overlay';
import {FloatingWindowTestingHelper, FloatingWindowOverlayTestContext} from '@testing-lib/helpers/floating-window-testing.helper';
import {FloatingWindowService} from '@terminal-core-lib/features/floating-window/services/floating-window.service';
import {SUBMIT_ORDER_CONTEXT} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {SignalDetailsWindowService} from './signal-details-window.service';
import {signalDetailsWindowProviders} from './signal-details-window.providers';
import {SignalDetailsWindowData} from '../types/signal-details-window.types';
import {AiSignalsViewModelHelper} from '../utils/ai-signals-view-model.helper';
import {SignalAction} from './ai-signals-service.types';

describe('SignalDetailsWindowService', () => {
  let windows: FloatingWindowService;
  let overlay: FloatingWindowOverlayTestContext;
  let firstInjector: EnvironmentInjector;
  let secondInjector: EnvironmentInjector;
  let first: SignalDetailsWindowService;
  let second: SignalDetailsWindowService;
  const rows = AiSignalsViewModelHelper.toRowViewModels([
    {ticker: 'AAA', exchange: 'MOEX'}, {ticker: 'BBB', exchange: 'MOEX'}
  ], {signals: [
    {ticker: 'AAA', exchange: 'MOEX', consensus: {action: SignalAction.BuyPullback}},
    {ticker: 'BBB', exchange: 'MOEX', consensus: {action: SignalAction.BuyPullback}}
  ]});

  beforeEach(() => {
    overlay = FloatingWindowTestingHelper.createOverlay();
    TestBed.configureTestingModule({providers: [{provide: Overlay, useValue: overlay.overlay}]});
    windows = TestBed.inject(FloatingWindowService);
    const parent = TestBed.inject(EnvironmentInjector);
    firstInjector = createEnvironmentInjector(signalDetailsWindowProviders, parent);
    secondInjector = createEnvironmentInjector([...signalDetailsWindowProviders,
      {provide: SUBMIT_ORDER_CONTEXT, useValue: {submitOrder: vi.fn()}}], parent);
    first = firstInjector.get(SignalDetailsWindowService);
    second = secondInjector.get(SignalDetailsWindowService);
  });

  afterEach(() => {
    windows.closeAll();
    if (!firstInjector.destroyed) {
      firstInjector.destroy();
    }
    if (!secondInjector.destroyed) {
      secondInjector.destroy();
    }
  });

  it('should update one shared window and transfer the polling pause to the latest widget', () => {
    first.open(rows[0]);
    const ref = windows.get<SignalDetailsWindowData>('ai-signal-details');
    expect(first.isOpen()).toBe(true);
    expect(second.isOpen()).toBe(false);

    second.open(rows[1]);

    expect(windows.get('ai-signal-details')).toBe(ref);
    expect(overlay.created).toHaveLength(1);
    expect(ref?.data().signal).toBe(rows[1]);
    expect(ref?.data().submitOrderContext).toBe(secondInjector.get(SUBMIT_ORDER_CONTEXT));
    expect(first.isOpen()).toBe(false);
    expect(second.isOpen()).toBe(true);
    firstInjector.destroy();
    expect(ref?.closed()).toBe(false);
    secondInjector.destroy();
    expect(ref?.closed()).toBe(true);
    expect(windows.get('ai-signal-details')).toBeNull();
  });

  it('should activate the same instrument without replacing its analysis input or dimensions', () => {
    first.open(rows[0]);
    const ref = windows.get<SignalDetailsWindowData>('ai-signal-details');
    const activate = vi.spyOn(ref!, 'activate');
    ref?.update({width: 900, height: 600});

    second.open({...rows[0]});

    expect(activate).toHaveBeenCalledOnce();
    expect(ref?.data().signal).toBe(rows[0]);
    expect(ref?.options()).toMatchObject({width: 900, height: 600});
  });

  it('should release the pause after closing and create a fresh window on the next click', () => {
    first.open(rows[0]);
    const previous = windows.get('ai-signal-details');
    previous?.close();
    expect(first.isOpen()).toBe(false);
    first.open(rows[1]);
    expect(windows.get('ai-signal-details')).not.toBe(previous);
    expect(first.isOpen()).toBe(true);
  });
});
