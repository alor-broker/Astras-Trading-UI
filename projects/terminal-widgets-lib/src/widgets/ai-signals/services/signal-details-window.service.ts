import {computed, DestroyRef, inject, Injectable, Injector, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {FloatingWindowService} from '@terminal-core-lib/features/floating-window/services/floating-window.service';
import {FloatingWindowRef} from '@terminal-core-lib/features/floating-window/services/floating-window-ref';
import {FloatingWindowPolicy} from '@terminal-core-lib/features/floating-window/types/floating-window.types';
import {SUBMIT_ORDER_CONTEXT} from '@terminal-core-lib/features/orders/types/submit-order-context.types';
import {SignalDetailsDialog} from '../components/signal-details-dialog/signal-details-dialog';
import {SignalRowViewModel} from '../types/ai-signals-view.types';
import {SignalDetailsWindowData} from '../types/signal-details-window.types';

/** Widget-scoped adapter. The shared registry, rather than this service, enforces uniqueness. */
@Injectable()
export class SignalDetailsWindowService {
  private readonly windows = inject(FloatingWindowService);
  private readonly injector = inject(Injector);
  private readonly owner = inject(DestroyRef);
  private readonly submitOrderContext = inject(SUBMIT_ORDER_CONTEXT, {optional: true});
  private readonly windowRef = signal<FloatingWindowRef<SignalDetailsWindowData> | null>(null);
  readonly isOpen = computed(() => {
    const ref = this.windowRef();
    return ref != null && !ref.closed() && ref.owner() === this.owner;
  });

  open(row: SignalRowViewModel): void {
    const existing = this.windows.get<SignalDetailsWindowData>('ai-signal-details');
    if (existing != null) {
      existing.setOwner(this.owner);
      const previous = existing.data().signal;
      const sameInstrument = previous.exchange === row.exchange && previous.ticker === row.ticker;
      existing.update({data: {signal: sameInstrument ? previous : row, submitOrderContext: this.submitOrderContext}});
      existing.activate();
      this.track(existing);
      return;
    }
    this.track(this.windows.open(SignalDetailsDialog, {
      id: 'ai-signal-details', groupId: 'ai-signal-details', policy: FloatingWindowPolicy.OnePerGroup,
      data: {signal: row, submitOrderContext: this.submitOrderContext},
      title: row.ticker, footer: null, width: 700, draggable: true, resizable: true,
      highlightOnActivate: false,
      panelClass: 'ats-ai-signal-details-dialog', injector: this.injector, owner: this.owner
    }));
  }

  private track(ref: FloatingWindowRef<SignalDetailsWindowData> | null): void {
    if (this.windowRef() === ref) {
      return;
    }
    this.windowRef.set(ref);
    ref?.afterClosed$.pipe(take(1), takeUntilDestroyed(this.owner)).subscribe(() => {
      if (this.windowRef() === ref) {
        this.windowRef.set(null);
      }
    });
  }
}
