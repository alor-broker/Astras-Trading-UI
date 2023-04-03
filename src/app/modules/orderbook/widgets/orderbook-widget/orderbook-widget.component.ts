import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { OrderbookService } from '../../services/orderbook.service';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
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
  ColumnsOrder,
  OrderbookSettings
} from '../../models/orderbook-settings.model';
import { NumberDisplayFormat } from '../../../../shared/models/enums/number-display-format';

@Component({
  selector: 'ats-orderbook-widget[guid][isBlockWidget]',
  templateUrl: './orderbook-widget.component.html',
  styleUrls: ['./orderbook-widget.component.less'],
  providers: [OrderbookService]
})
export class OrderbookWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;
  @Input()
  guid!: string;

  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<OrderbookSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderbookSettings>(
      this.guid,
      'OrderbookSettings',
      settings => ({
        ...settings,
        depth: 17,
        showChart: true,
        showTable: true,
        showYieldForBonds: false,
        useOrderWidget: false,
        showVolume: false,
        columnsOrder: ColumnsOrder.volumesAtTheEdges,
        volumeDisplayFormat: NumberDisplayFormat.Default
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderbookSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
