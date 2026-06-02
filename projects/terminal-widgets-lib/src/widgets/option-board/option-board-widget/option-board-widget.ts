import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation
} from '@angular/core';
import {OptionBoardService} from '@terminal-widgets-lib/widgets/option-board/services/option-board.service';
import {OptionBoardDataContextFactory} from '@terminal-widgets-lib/widgets/option-board/utils/option-board-data-context-factory';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {OptionBoardWidgetSettings} from '@terminal-widgets-lib/widgets/option-board/widget-settings.types';
import {WidgetSettingsFactoryHelper} from '@terminal-widgets-lib/common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {take} from 'rxjs';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {OptionBoard} from '@terminal-widgets-lib/widgets/option-board/components/option-board/option-board';
import {OptionBoardSettings} from '@terminal-widgets-lib/widgets/option-board/components/option-board-settings/option-board-settings';

@Component({
  selector: 'ats-option-board-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    OptionBoard,
    OptionBoardSettings
  ],
  templateUrl: './option-board-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    OptionBoardService,
    OptionBoardDataContextFactory
  ]
})
export class OptionBoardWidget extends WidgetBase<OptionBoardWidgetSettings> {
  private readonly deviceService = inject(DeviceService);

  deviceInfo$ = this.deviceService.deviceInfo$
    .pipe(
      take(1)
    );

  private readonly dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  protected override createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<OptionBoardWidgetSettings>(
      this.widgetInstance(),
      'OptionBoardSettings',
      settings => ({
        ...settings
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
