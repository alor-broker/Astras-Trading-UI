import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {InstrumentIcon} from '@terminal-core-lib/common/components/instrument-icon/instrument-icon';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  SignalDirection
} from '../../services/ai-signals-service.types';
import {
  SignalRowStatus,
  SignalRowViewModel
} from '../../types/ai-signals-view.types';
import {SignalOverview} from '../signal-overview/signal-overview';
import {AiSignalsViewModelHelper} from '../../utils/ai-signals-view-model.helper';

type SignalAccent = 'bullish' | 'bearish' | 'neutral' | 'inactive';

@Component({
  selector: 'ats-signal-list-item',
  imports: [
    TranslocoDirective,
    NzTagComponent,
    NzIconDirective,
    NzTooltipDirective,
    InstrumentIcon,
    SignalOverview
  ],
  templateUrl: './signal-list-item.html',
  styleUrl: './signal-list-item.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalListItem {
  readonly row = input.required<SignalRowViewModel>();

  readonly openDetails = output<void>();

  readonly instrumentSelected = output<InstrumentKey>();

  protected readonly rowStatuses = SignalRowStatus;

  protected readonly isClickable = computed(() => AiSignalsViewModelHelper.canOpenDetails(this.row()));

  protected readonly accent = computed<SignalAccent>(() => {
    const row = this.row();

    if (row.status === SignalRowStatus.NoData
      || row.status === SignalRowStatus.Error
      || row.status === SignalRowStatus.Expired
      || row.status === SignalRowStatus.NotReady
      || row.status === SignalRowStatus.NotAnalyzed) {
      return 'inactive';
    }

    switch (row.direction) {
      case SignalDirection.Bullish:
        return 'bullish';
      case SignalDirection.Bearish:
        return 'bearish';
      default:
        return 'neutral';
    }
  });

  protected onRowClick(): void {
    if (this.isClickable()) {
      this.openDetails.emit();
    }
  }

  protected onRowKeydown(event: Event): void {
    if (event.target === event.currentTarget) {
      event.preventDefault();
      this.onRowClick();
    }
  }

  protected onIconClick(event: MouseEvent): void {
    event.stopPropagation();

    const row = this.row();
    if (row.exchange == null) {
      return;
    }

    this.instrumentSelected.emit(InstrumentKeyHelper.toInstrumentKey({
      symbol: row.ticker,
      exchange: row.exchange
    }));
  }
}
