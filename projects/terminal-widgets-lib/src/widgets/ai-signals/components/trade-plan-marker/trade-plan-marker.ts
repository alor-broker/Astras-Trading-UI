import {ChangeDetectionStrategy, Component, computed, input, ViewEncapsulation} from '@angular/core';
import {TradePlanLevel} from '../../types/trade-plan-level.types';

@Component({
  selector: 'ats-trade-plan-marker',
  template: '<span class="marker-dot"></span>',
  styleUrl: './trade-plan-marker.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-level]': 'level()',
    '[class.outlined]': 'outlined()',
    '[class.legend]': 'legend()',
    'aria-hidden': 'true'
  }
})
export class TradePlanMarker {
  readonly level = input.required<TradePlanLevel>();

  readonly legend = input(false);

  protected readonly outlined = computed(() => !this.legend()
    && this.level() !== TradePlanLevel.CurrentPrice && this.level() !== TradePlanLevel.StopLoss);
}
