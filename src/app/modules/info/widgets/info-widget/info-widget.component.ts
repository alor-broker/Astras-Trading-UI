import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import {
  Observable,
  shareReplay,
  switchMap
} from 'rxjs';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { DashboardContextService } from '../../../../shared/services/dashboard-context.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { SettingsHelper } from '../../../../shared/utils/settings-helper';
import { InfoSettings } from '../../models/info-settings.model';
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import { map } from "rxjs/operators";
import { InstrumentSummary } from "../../models/instrument-summary.model";
import { InstrumentType } from "../../../../shared/models/enums/instrument-type.model";
import { getTypeByCfi } from "../../../../shared/utils/instruments";

@Component({
  selector: 'ats-info-widget',
  templateUrl: './info-widget.component.html',
  styleUrls: ['./info-widget.component.less']
})
export class InfoWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<InfoSettings>;
  showBadge$!: Observable<boolean>;
  instrumentSummary$!: Observable<InstrumentSummary | null>;

  InstrumentTypes = InstrumentType;

  isLoading = false;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentService: InstrumentsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<InfoSettings>(
      this.widgetInstance,
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
    this.isLoading = value;
  }
}
