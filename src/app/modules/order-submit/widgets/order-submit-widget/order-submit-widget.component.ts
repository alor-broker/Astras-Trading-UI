import {
  Component,
  Input,
  OnInit
} from '@angular/core';
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
import { OrderSubmitSettings } from '../../models/order-submit-settings.model';
import { WidgetsHelper } from "../../../../shared/utils/widgets";
import { WidgetNames } from "../../../../shared/models/enums/widget-names";

@Component({
  selector: 'ats-order-submit-widget[guid][isBlockWidget]',
  templateUrl: './order-submit-widget.component.html',
  styleUrls: ['./order-submit-widget.component.less']
})
export class OrderSubmitWidgetComponent implements OnInit {
  shouldShowSettings: boolean = false;
  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<OrderSubmitSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OrderSubmitSettings>(
      this.guid,
      'OrderSubmitSettings',
      settings => ({
        ...settings,
        enableLimitOrdersFastEditing: false,
        limitOrderPriceMoveSteps: [1, 2, 5, 10],
        showVolumePanel: false,
        workingVolumes: [1, 5, 10, 20, 30, 40, 50, 100, 200],
        titleIcon: new WidgetsHelper().getIconName(WidgetNames.orderSubmit)
      }),
      this.dashboardContextService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<OrderSubmitSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);

    this.title$ = this.settings$.pipe(
      switchMap(s => this.instrumentService.getInstrument(s as InstrumentKey)),
      filter((x): x is Instrument => !!x),
      map(x => `${x.symbol} ${x.instrumentGroup ? '(' + x.instrumentGroup + ')' : ''} ${x.shortName}`)
    );
  }
}
