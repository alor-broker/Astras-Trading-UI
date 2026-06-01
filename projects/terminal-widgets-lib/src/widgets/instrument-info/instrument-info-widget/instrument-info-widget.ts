import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  ViewEncapsulation
} from '@angular/core';
import {WidgetBase} from '@terminal-widgets-lib/common/widget.base';
import {InstrumentInfoWidgetSettings} from '../widget-settings.types';
import {WidgetSettingsFactoryHelper} from '../../../common/utils/widget-settings-factory.helper';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {TranslocoDirective} from '@jsverse/transloco';
import {AsyncPipe} from '@angular/common';
import {WidgetSkeleton} from '@terminal-widgets-lib/common/components/widget-skeleton/widget-skeleton';
import {WidgetHeader} from '@terminal-widgets-lib/common/components/widget-header/widget-header';
import {WidgetHeaderInstrumentSwitch} from '@terminal-widgets-lib/common/components/widget-header-instrument-switch/widget-header-instrument-switch';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {InfoHeaderInfoHeaderComponent} from '@terminal-widgets-lib/widgets/instrument-info/components/info-header/info-header';
import {StockInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/stock-info/stock-info';
import {InstrumentType} from '@terminal-core-lib/common/types/instrument.types';
import {
  map,
  Observable,
  switchMap
} from 'rxjs';
import {InstrumentsService} from '@terminal-core-lib/features/instruments/services/instruments.service';
import {InstrumentSummary} from '@terminal-widgets-lib/widgets/instrument-info/types/instrument-summary.types';
import {InstrumentHelper} from '@terminal-core-lib/features/instruments/utils/instrument-helper';
import {BondInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/bond-info/bond-info';
import {DerivativeInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/derivative-info/derivative-info';
import {CommonInfo} from '@terminal-widgets-lib/widgets/instrument-info/components/common-info/common-info';

@Component({
  selector: 'ats-instrument-info-widget',
  imports: [
    TranslocoDirective,
    AsyncPipe,
    WidgetSkeleton,
    WidgetHeader,
    WidgetHeaderInstrumentSwitch,
    NzSpinComponent,
    InfoHeaderInfoHeaderComponent,
    StockInfo,
    BondInfo,
    DerivativeInfo,
    CommonInfo
  ],
  templateUrl: './instrument-info-widget.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstrumentInfoWidget extends WidgetBase<InstrumentInfoWidgetSettings> {
  readonly InstrumentTypes = InstrumentType;

  readonly isLoading = signal(false);

  instrumentSummary$!: Observable<InstrumentSummary | null>;

  protected dashboardContextService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly instrumentService = inject(InstrumentsService);

  override ngOnInit(): void {
    super.ngOnInit();

    this.instrumentSummary$ = this.settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      map(i => {
        if (i == null || i.instrumentGroup == null) {
          return null;
        }

        return {
          ...i,
          board: i.instrumentGroup!,
          typeByCfi: InstrumentHelper.getTypeByCfi(i.cfiCode)
        };
      })
    );
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }

  protected createSettingsIfMissing(): void {
    WidgetSettingsFactoryHelper.createInstrumentLinkedWidgetSettingsIfMissing<InstrumentInfoWidgetSettings>(
      this.widgetInstance(),
      'InfoSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );
  }
}
