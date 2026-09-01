import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {map} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent} from 'ng-zorro-antd/modal';
import {NzTagComponent} from 'ng-zorro-antd/tag';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {NzAlertComponent} from 'ng-zorro-antd/alert';
import {
  NzCollapseComponent,
  NzCollapsePanelComponent
} from 'ng-zorro-antd/collapse';
import {MarkdownComponent} from 'ngx-markdown';
import {AtsPrice} from '@terminal-core-lib/common/pipes/price';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {
  RiskLevel,
  SignalAction,
  SignalDirection
} from '../../services/ai-signals-service.types';
import {
  SignalRowStatus,
  SignalRowViewModel
} from '../../types/ai-signals-view.types';
import {AiSignalsViewModelHelper} from '../../utils/ai-signals-view-model.helper';
import {TradePlanChart} from '../trade-plan-chart/trade-plan-chart';
import {AnalystsChart} from '../analysts-chart/analysts-chart';
import {FreeFormDetails} from '../free-form-details/free-form-details';
import {ConfidenceMeter} from '../confidence-meter/confidence-meter';

type SignalAccent = 'bullish' | 'bearish' | 'neutral';

@Component({
  selector: 'ats-signal-details-dialog',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    NzModalComponent,
    NzTagComponent,
    NzIconDirective,
    NzAlertComponent,
    NzCollapseComponent,
    NzCollapsePanelComponent,
    AtsPrice,
    MarkdownComponent,
    TradePlanChart,
    AnalystsChart,
    FreeFormDetails,
    ConfidenceMeter
  ],
  templateUrl: './signal-details-dialog.html',
  styleUrl: './signal-details-dialog.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignalDetailsDialog {
  readonly displaySignal = model<SignalRowViewModel | null>(null);

  protected readonly rowStatuses = SignalRowStatus;

  protected readonly actions = SignalAction;

  protected readonly directions = SignalDirection;

  protected readonly riskLevels = RiskLevel;

  protected readonly isMobile$ = inject(DeviceService).deviceInfo$.pipe(
    map(deviceInfo => deviceInfo.isMobile)
  );

  protected readonly details = computed(() => {
    const row = this.displaySignal();
    if (row == null) {
      return null;
    }

    return AiSignalsViewModelHelper.toDetailsViewModel(row);
  });

  protected readonly hasVerdict = computed(() => {
    const details = this.details();
    if (details == null) {
      return false;
    }

    return details.direction != null
      || details.action != null
      || details.confidence != null
      || details.currentPrice != null
      || details.expectedHoldingDays != null;
  });

  protected readonly accent = computed<SignalAccent>(() => {
    switch (this.details()?.direction) {
      case SignalDirection.Bullish:
        return 'bullish';
      case SignalDirection.Bearish:
        return 'bearish';
      default:
        return 'neutral';
    }
  });

  protected readonly directionIcon = computed(() => {
    switch (this.details()?.direction) {
      case SignalDirection.Bullish:
        return 'rise';
      case SignalDirection.Bearish:
        return 'fall';
      default:
        return 'minus';
    }
  });

  protected readonly hasRiskInfo = computed(() => {
    const details = this.details();
    if (details == null) {
      return false;
    }

    return details.newsRisk != null
      || details.gapRisk != null
      || details.avoidReasons.length > 0;
  });

  protected close(): void {
    this.displaySignal.set(null);
  }
}
