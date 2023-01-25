import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { TimeframesHelper } from '../../utils/timeframes-helper';
import { TimeframeValue } from '../../models/light-chart.models';
import {
  Observable,
  switchMap
} from 'rxjs';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  filter,
  map
} from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import {
  LightChartSettings,
  TimeFrameDisplayMode
} from '../../models/light-chart-settings.model';

@Component({
  selector: 'ats-light-chart-widget[shouldShowSettings][guid][isBlockWidget]',
  templateUrl: './light-chart-widget.component.html',
  styleUrls: ['./light-chart-widget.component.less']
})
export class LightChartWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;


  @Input()
  guid!: string;

  @Input()
  isBlockWidget!: boolean;

  settings$!: Observable<LightChartSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService
  ) {
  }

  onSettingsChange() {
    this.shouldShowSettingsChange.emit(!this.shouldShowSettings);
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<LightChartSettings>(
      this.guid,
      'LightChartSettings',
      settings => ({
        ...settings,
        timeFrame: TimeframesHelper.getTimeframeByValue(TimeframeValue.Day)?.value,
        timeFrameDisplayMode: TimeFrameDisplayMode.Buttons,
        width: 300,
        height: 300
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<LightChartSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
