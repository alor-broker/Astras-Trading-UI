import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation
} from '@angular/core';
import {AllInstrumentsService} from '@terminal-widgets-lib/widgets/all-instruments/services/all-instruments.service';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {
  allInstrumentsColumns,
  AllInstrumentsWidgetSettings
} from '@terminal-widgets-lib/widgets/all-instruments/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {ValueHelper} from '@terminal-core-lib/common/utils/value.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {AllInstruments} from '@terminal-widgets-lib/widgets/all-instruments/components/all-instruments/all-instruments';
import {AllInstrumentsSettings} from '@terminal-widgets-lib/widgets/all-instruments/components/all-instruments-settings/all-instruments-settings';

@Component({
  selector: 'ats-all-instruments-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    AllInstruments,
    AllInstrumentsSettings
  ],
  templateUrl: './all-instruments-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AllInstrumentsService]
})
export class AllInstrumentsWidget extends WidgetBase<AllInstrumentsWidgetSettings> {
  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createWidgetSettingsIfMissing<AllInstrumentsWidgetSettings>(
      this.widgetInstance(),
      'AllInstrumentsSettings',
      settings => ({
        ...settings,
        badgeColor: ValueHelper.getValueOrDefault(settings.badgeColor, DefaultBadge),
        allInstrumentsColumns: ValueHelper.getValueOrDefault(
          settings.allInstrumentsColumns,
          allInstrumentsColumns.filter(c => c.isDefault).map(col => col.id)
        )
      }),
      this.widgetSettingsService
    );
  }

}
