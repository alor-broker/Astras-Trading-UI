import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, Injector, input, model, output,
  untracked, ViewEncapsulation} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {take} from 'rxjs';
import {FloatingWindowRef} from '../../services/floating-window-ref';
import {FloatingWindowService} from '../../services/floating-window.service';
import {FloatingWindowContent, FloatingWindowOptions, FloatingWindowPolicy} from '../../types/floating-window.types';

/** Declarative adapter; the actual surface is rendered outside the widget's clipping boundary. */
@Component({
  selector: 'ats-floating-window',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FloatingWindow<D = unknown, R = unknown> {
  readonly visible = model(false);
  readonly content = input.required<FloatingWindowContent<D, R>>();
  readonly options = input.required<FloatingWindowOptions<D, R>>();
  readonly windowId = input<string>();
  readonly groupId = input('common');
  readonly policy = input(FloatingWindowPolicy.Multiple);
  readonly afterOpened = output<void>();
  readonly afterClosed = output<R | undefined>();
  readonly openRejected = output<void>();
  readonly actionError = output<unknown>();
  private readonly service = inject(FloatingWindowService);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private ref: FloatingWindowRef<D, R> | null = null;

  constructor() {
    effect(() => {
      const visible = this.visible();
      const content = this.content();
      const options = this.options();
      const id = this.windowId();
      const groupId = this.groupId();
      const policy = this.policy();
      untracked(() => {
        if (!visible) {
          this.ref?.close();
          return;
        }
        if (this.ref != null) {
          this.ref.update(options);
          return;
        }
        const ref = this.service.open(content, {...options, id, groupId, policy,
          injector: this.injector, owner: this.destroyRef});
        this.ref = ref;
        if (ref == null) {
          this.visible.set(false);
          this.openRejected.emit();
          return;
        }
        ref.afterOpened$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.afterOpened.emit());
        ref.actionErrors$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(error => this.actionError.emit(error));
        ref.afterClosed$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(result => {
          this.ref = null;
          if (this.destroyRef.destroyed) {
            return;
          }
          this.visible.set(false);
          this.afterClosed.emit(result);
        });
      });
    });
  }
}
