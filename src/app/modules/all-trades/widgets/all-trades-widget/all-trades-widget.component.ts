import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import {
  Observable,
  switchMap
} from 'rxjs';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  filter,
  map
} from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import {
  AllTradesSettings,
  allTradesWidgetColumns
} from '../../models/all-trades-settings.model';

@Component({
  selector: 'ats-all-trades-widget[guid][isBlockWidget]',
  templateUrl: './all-trades-widget.component.html',
  styleUrls: ['./all-trades-widget.component.less']
})
export class AllTradesWidgetComponent implements OnInit {

  shouldShowSettings: boolean = false;
  @Input() public guid!: string;

  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<AllTradesSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService) {
  }

  onSettingsChange() {
    this.shouldShowSettings = !this.shouldShowSettings;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<AllTradesSettings>(
      this.guid,
      'AllTradesSettings',
      settings => ({
        ...settings,
        allTradesColumns: allTradesWidgetColumns.filter(c => c.isDefault).map(col => col.columnId)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<AllTradesSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
