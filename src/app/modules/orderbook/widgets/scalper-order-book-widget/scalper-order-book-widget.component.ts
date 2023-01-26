import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { ScalperOrderBookService } from "../../services/scalper-order-book.service";
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
import {
  ScalperOrderBookSettings,
  VolumeHighlightMode
} from '../../models/scalper-order-book-settings.model';

@Component({
  selector: 'ats-scalper-order-book-widget[guid][isBlockWidget]',
  templateUrl: './scalper-order-book-widget.component.html',
  styleUrls: ['./scalper-order-book-widget.component.less'],
  providers: [ScalperOrderBookService]
})
export class ScalperOrderBookWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;

  @Input()
  isBlockWidget!: boolean;
  @Input()
  guid!: string;

  @Input()
  isActive: boolean = false;

  settings$!: Observable<ScalperOrderBookSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<ScalperOrderBookSettings>(
      this.guid,
      'ScalperOrderBookSettings',
      settings => ({
        ...settings,
        title: `Скальперский стакан`,
        titleIcon: 'ordered-list',
        depth: 10,
        showZeroVolumeItems: true,
        showSpreadItems: true,
        volumeHighlightMode: VolumeHighlightMode.BiggestVolume,
        volumeHighlightFullness: 10000,
        volumeHighlightOptions: [
          { boundary: 1000, color: '#71DB20' },
          { boundary: 5000, color: '#ff0000' },
          { boundary: 10000, color: '#ff00ff' }
        ],
        workingVolumes: [1, 10, 100, 1000],
        disableHotkeys: true,
        enableMouseClickSilentOrders: false,
        autoAlignIntervalSec: 15,
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<ScalperOrderBookSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
