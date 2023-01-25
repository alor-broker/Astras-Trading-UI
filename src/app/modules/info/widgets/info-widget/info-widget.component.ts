import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  Observable,
  switchMap
} from 'rxjs';
import { ExchangeInfo } from '../../models/exchange-info.model';
import { InfoService } from '../../services/info.service';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { TerminalSettingsService } from '../../../terminal-settings/services/terminal-settings.service';
import { InstrumentsService } from '../../../instruments/services/instruments.service';
import { InstrumentKey } from '../../../../shared/models/instruments/instrument-key.model';
import {
  filter,
  map
} from 'rxjs/operators';
import { Instrument } from '../../../../shared/models/instruments/instrument.model';
import { InfoSettings } from '../../models/info-settings.model';

@Component({
  selector: 'ats-info-widget[guid][isBlockWidget]',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less'],
  providers: [InfoService]
})
export class InfoWidgetComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;

  @Input()
  isBlockWidget!: boolean;

  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();
  settings$!: Observable<InfoSettings>;
  showBadge$!: Observable<boolean>;
  title$!: Observable<string>;
  info$?: Observable<ExchangeInfo | null>;

  constructor(
    private readonly service: InfoService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService
  ) {
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<InfoSettings>(
      this.guid,
      'InfoSettings',
      settings => ({
        ...settings,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InfoSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );

    this.service.init(this.guid);
    this.info$ = this.service.getExchangeInfo();
  }
}
