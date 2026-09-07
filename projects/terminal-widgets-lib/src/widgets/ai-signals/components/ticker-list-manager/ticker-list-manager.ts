import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {NzCheckboxComponent} from 'ng-zorro-antd/checkbox';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzModalComponent} from 'ng-zorro-antd/modal';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {concat, map, of, switchMap} from 'rxjs';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {AiSignalsService} from '../../services/ai-signals.service';
import {
  SignalInstrumentOption,
  SignalInstrumentsHelper
} from '../../utils/signal-instruments.helper';
import {SignalInstrumentKey} from '../../services/ai-signals-service.types';

interface InstrumentsState {
  loading: boolean;
  instruments: SignalInstrumentOption[] | null;
}

@Component({
  selector: 'ats-ticker-list-manager',
  imports: [
    InstrumentIcon,
    TranslocoDirective,
    NzButtonComponent,
    NzCheckboxComponent,
    NzEmptyComponent,
    NzIconDirective,
    NzModalComponent,
    NzSpinComponent
  ],
  templateUrl: './ticker-list-manager.html',
  styleUrl: './ticker-list-manager.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TickerListManager {
  readonly instruments = input.required<SignalInstrumentKey[]>();

  readonly instrumentsChanged = output<SignalInstrumentKey[]>();

  protected readonly isOpen = signal(false);

  protected readonly draftInstrumentKeys = signal<ReadonlySet<string>>(new Set());

  private readonly refreshVersion = signal(0);

  private readonly aiSignalsService = inject(AiSignalsService);

  private readonly loadRequest = computed(() => this.isOpen() ? this.refreshVersion() : null);

  // Closing the dialog or destroying the component cancels an in-flight request.
  protected readonly instrumentsState = toSignal(toObservable(this.loadRequest).pipe(
    switchMap(request => request == null
      ? of<InstrumentsState>({loading: true, instruments: null})
      : concat(
        of<InstrumentsState>({loading: true, instruments: null}),
        this.aiSignalsService.getInstruments().pipe(
          map(response => ({
            loading: false,
            instruments: response == null ? null : SignalInstrumentsHelper.availableInstruments(response.instruments)
          }))
        )
      ))
  ), {initialValue: {loading: true, instruments: null} as InstrumentsState});

  protected readonly selectedInstruments = computed(() => {
    const availableInstruments = this.instrumentsState().instruments ?? [];
    const selectedKeys = this.draftInstrumentKeys();

    return SignalInstrumentsHelper.resolveAvailableInstruments(
      availableInstruments.filter(instrument => selectedKeys.has(SignalInstrumentsHelper.toKey(instrument))),
      availableInstruments
    );
  });

  protected readonly allSelected = computed(() => this.selectedInstruments().length > 0
    && this.selectedInstruments().length === this.instrumentsState().instruments?.length);

  protected readonly partiallySelected = computed(() => this.selectedInstruments().length > 0 && !this.allSelected());

  protected readonly canApply = computed(() => !this.instrumentsState().loading
    && this.instrumentsState().instruments != null);

  protected open(): void {
    this.draftInstrumentKeys.set(new Set(this.instruments().map(instrument => SignalInstrumentsHelper.toKey(instrument))));
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }

  protected retry(): void {
    this.refreshVersion.update(version => version + 1);
  }

  protected toggleAll(checked: boolean): void {
    this.draftInstrumentKeys.set(new Set(checked
      ? (this.instrumentsState().instruments ?? []).map(instrument => SignalInstrumentsHelper.toKey(instrument))
      : []));
  }

  protected toggleTicker(instrument: SignalInstrumentOption, checked: boolean): void {
    this.draftInstrumentKeys.update(instrumentKeys => {
      const next = new Set(instrumentKeys);
      const key = SignalInstrumentsHelper.toKey(instrument);
      if (checked) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }

  protected isSelected(instrument: SignalInstrumentOption): boolean {
    return this.draftInstrumentKeys().has(SignalInstrumentsHelper.toKey(instrument));
  }

  protected apply(): void {
    if (!this.canApply()) {
      return;
    }

    this.instrumentsChanged.emit(this.selectedInstruments());
    this.close();
  }
}
