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
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  SignalAction,
  SignalDirection
} from '../../services/ai-signals-service.types';
import {
  SignalRowStatus,
  SignalRowViewModel
} from '../../types/ai-signals-view.types';
import {ConfidenceMeter} from '../confidence-meter/confidence-meter';

type SignalAccent = 'bullish' | 'bearish' | 'neutral' | 'inactive';

@Component({
  selector: 'ats-signal-list-item',
  imports: [
    TranslocoDirective,
    NzTagComponent,
    NzIconDirective,
    NzTooltipDirective,
    InstrumentIcon,
    AtsPrice,
    ConfidenceMeter
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

  protected readonly actions = SignalAction;

  protected readonly directions = SignalDirection;

  protected readonly isClickable = computed(() => this.row().raw != null);

  protected readonly accent = computed<SignalAccent>(() => {
    const row = this.row();

    if (row.status === SignalRowStatus.NoData || row.status === SignalRowStatus.Error) {
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

  protected readonly directionIcon = computed(() => {
    switch (this.row().direction) {
      case SignalDirection.Bullish:
        return 'rise';
      case SignalDirection.Bearish:
        return 'fall';
      default:
        return 'minus';
    }
  });

  protected onRowClick(): void {
    if (this.isClickable()) {
      this.openDetails.emit();
    }
  }

  protected onIconClick(event: MouseEvent): void {
    event.stopPropagation();

    this.instrumentSelected.emit({
      symbol: this.row().ticker,
      exchange: this.row().exchange
    });
  }
}
