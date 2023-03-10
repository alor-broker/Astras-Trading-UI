import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { TechChartDatafeedService } from "../../services/tech-chart-datafeed.service";
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import {
  Observable,
  switchMap
} from 'rxjs';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  filter,
  map
} from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { TechChartSettings } from '../../models/tech-chart-settings.model';

@Component({
  selector: 'ats-tech-chart-widget[guid][isBlockWidget]',
  templateUrl: './tech-chart-widget.component.html',
  styleUrls: ['./tech-chart-widget.component.less'],
  providers: [TechChartDatafeedService]
})
export class TechChartWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;
  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<TechChartSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService
  ) {
  }

  onSettingsChange() {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<TechChartSettings>(
      this.guid,
      'TechChartSettings',
      settings => ({
        ...settings,
        chartSettings: {}
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<TechChartSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
