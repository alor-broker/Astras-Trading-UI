import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {InvestIdeasService} from '@terminal-widgets-lib/widgets/invest-ideas/services/invest-ideas.service';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {InvestIdeasWidgetSettings} from '@terminal-widgets-lib/widgets/invest-ideas/widget-settings.types';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {take} from 'rxjs';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {InvestIdeasCarousel} from '@terminal-widgets-lib/widgets/invest-ideas/components/invest-ideas-carousel/invest-ideas-carousel';

@Component({
  selector: 'ats-invest-ideas-desktop-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    InvestIdeasCarousel
  ],
  templateUrl: './invest-ideas-desktop-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    InvestIdeasService
  ]
})
export class InvestIdeasDesktopWidget extends WidgetBase<InvestIdeasWidgetSettings> {
  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  selectInstrument(instrumentKey: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrumentKey, s.badgeColor ?? DefaultBadge);
    });
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<InvestIdeasWidgetSettings>(
      this.widgetInstance(),
      'InvestIdeasSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
      }),
      this.widgetSettingsService
    );
  }
}
