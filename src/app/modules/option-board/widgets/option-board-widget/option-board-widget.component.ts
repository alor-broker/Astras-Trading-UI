import {Component, Input, OnInit} from '@angular/core';
import {Observable, switchMap} from "rxjs";
import {OptionBoardSettings} from "../../models/option-board-settings.model";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {TerminalSettingsService} from "../../../terminal-settings/services/terminal-settings.service";
import {InstrumentsService} from "../../../instruments/services/instruments.service";
import {WidgetSettingsCreationHelper} from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import {OrderSubmitSettings} from "../../../order-submit/models/order-submit-settings.model";
import {SettingsHelper} from "../../../../shared/utils/settings-helper";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {filter, map} from "rxjs/operators";
import {Instrument} from "../../../../shared/models/instruments/instrument.model";
import {WidgetsHelper} from "../../../../shared/utils/widgets";
import {WidgetNames} from "../../../../shared/models/enums/widget-names";

@Component({
  selector: 'ats-option-board-widget[guid][isBlockWidget]',
  templateUrl: './option-board-widget.component.html',
  styleUrls: ['./option-board-widget.component.less']
})
export class OptionBoardWidgetComponent implements OnInit {
  widgetNames = WidgetNames;
  widgetsHelper = WidgetsHelper;
  shouldShowSettings: boolean = false;
  @Input()
  guid!: string;
  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<OptionBoardSettings>;
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
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<OptionBoardSettings>(
      this.guid,
      'OptionBoardSettings',
      settings => ({
        ...settings
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
