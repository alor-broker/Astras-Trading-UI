import { Component, input, OnInit, signal, inject } from '@angular/core';
import {Observable, shareReplay, switchMap} from 'rxjs';
import {WidgetSettingsService} from '../../../../shared/services/widget-settings.service';
import {DashboardContextService} from '../../../../shared/services/dashboard-context.service';
import {WidgetSettingsCreationHelper} from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import {SettingsHelper} from '../../../../shared/utils/settings-helper';
import {InfoSettings} from '../../models/info-settings.model';
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TerminalSettingsService} from "../../../../shared/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {map} from "rxjs/operators";
import {InstrumentSummary} from "../../models/instrument-summary.model";
import {InstrumentType} from "../../../../shared/models/enums/instrument-type.model";
import {getTypeByCfi} from "../../../../shared/utils/instruments";
import {TranslocoDirective} from '@jsverse/transloco';
import {WidgetSkeletonComponent} from '../../../../shared/components/widget-skeleton/widget-skeleton.component';
import {WidgetHeaderComponent} from '../../../../shared/components/widget-header/widget-header.component';
import {
  WidgetHeaderInstrumentSwitchComponent
} from '../../../../shared/components/widget-header-instrument-switch/widget-header-instrument-switch.component';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {InfoHeaderComponent} from '../../components/common/info-header/info-header.component';
import {StockInfoComponent} from '../../components/stocks/stock-info/stock-info.component';
import {BondInfoComponent} from '../../components/bonds/bond-info/bond-info.component';
import {DerivativeInfoComponent} from '../../components/derivatives/derivative-info/derivative-info.component';
import {CommonInfoComponent} from '../../components/common/common-info/common-info.component';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-info-widget',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less'],
  imports: [
    TranslocoDirective,
    WidgetSkeletonComponent,
    WidgetHeaderComponent,
    WidgetHeaderInstrumentSwitchComponent,
    NzSpinComponent,
    InfoHeaderComponent,
    StockInfoComponent,
    BondInfoComponent,
    DerivativeInfoComponent,
    CommonInfoComponent,
    AsyncPipe
  ]
})
export class InfoWidgetComponent implements OnInit {
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly dashboardContextService = inject(DashboardContextService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly instrumentService = inject(InstrumentsService);

  readonly widgetInstance = input.required<WidgetInstance>();

  readonly isBlockWidget = input.required<boolean>();

  settings$!: Observable<InfoSettings>;
  showBadge$!: Observable<boolean>;
  instrumentSummary$!: Observable<InstrumentSummary | null>;

  InstrumentTypes = InstrumentType;

  readonly isLoading = signal(false);

  get guid(): string {
    return this.widgetInstance().instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<InfoSettings>(
      this.widgetInstance(),
      'InfoSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InfoSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.instrumentSummary$ = this.settings$.pipe(
      switchMap(settings => this.instrumentService.getInstrument(settings)),
      map(i => {
        if (i == null || i.instrumentGroup == null) {
          return null;
        }

        return {
          ...i,
          board: i.instrumentGroup!,
          typeByCfi: getTypeByCfi(i.cfiCode)
        };
      })
    );
  }

  setLoading(value: boolean): void {
    this.isLoading.set(value);
  }
}
