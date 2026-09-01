import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {AsyncPipe} from '@angular/common';
import {take} from 'rxjs';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  AiSignalsWidgetSettings,
  defaultAiSignalsWidgetSettings
} from '../widget-settings.types';
import {AiSignalsContent} from '../components/ai-signals-content/ai-signals-content';
import {AiSignalsSettings} from '../components/ai-signals-settings/ai-signals-settings';

@Component({
  selector: 'ats-ai-signals-widget',
  imports: [
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    AiSignalsContent,
    AiSignalsSettings
  ],
  templateUrl: './ai-signals-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiSignalsWidget extends WidgetBase<AiSignalsWidgetSettings> {
  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  protected selectInstrument(instrumentKey: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.actionsContext.selectInstrument(instrumentKey, settings.badgeColor ?? DefaultBadge);
    });
  }

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<AiSignalsWidgetSettings>(
      this.widgetInstance(),
      'AiSignalsSettings',
      settings => ({
        ...settings,
        refreshIntervalSec: ValueHelper.getValueOrDefault(
          settings.refreshIntervalSec,
          defaultAiSignalsWidgetSettings.refreshIntervalSec
        ),
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
      }),
      this.widgetSettingsService
    );
  }
}
