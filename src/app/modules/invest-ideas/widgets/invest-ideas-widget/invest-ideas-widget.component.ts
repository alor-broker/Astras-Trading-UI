import {
  Component,
  Inject,
  Input,
  OnInit
} from '@angular/core';
import { AsyncPipe } from "@angular/common";
import { SharedModule } from "../../../../shared/shared.module";
import { WidgetInstance } from "../../../../shared/models/dashboard/dashboard-item.model";
import {
  Observable,
  take
} from "rxjs";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { WidgetSettingsCreationHelper } from "../../../../shared/utils/widget-settings/widget-settings-creation-helper";
import { InvestIdeasSettings } from "../../models/invest-ideas-settings.model";
import { InvestIdeasCarouselComponent } from "../../components/invest-ideas-carousel/invest-ideas-carousel.component";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../../shared/services/actions-context";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../../shared/services/terminal-settings.service";
import { getValueOrDefault } from "../../../../shared/utils/object-helper";

@Component({
  selector: 'ats-invest-ideas-widget',
  imports: [
    AsyncPipe,
    SharedModule,
    InvestIdeasCarouselComponent
],
  templateUrl: './invest-ideas-widget.component.html',
  styleUrl: './invest-ideas-widget.component.less'
})
export class InvestIdeasWidgetComponent implements OnInit {
  @Input({required: true})
  widgetInstance!: WidgetInstance;

  @Input({required: true})
  isBlockWidget!: boolean;

  settings$!: Observable<InvestIdeasSettings>;

  showBadge$!: Observable<boolean>;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createWidgetSettingsIfMissing<InvestIdeasSettings>(
      this.widgetInstance,
      'InvestIdeasSettings',
      settings => ({
        ...settings,
        badgeColor: getValueOrDefault(settings.badgeColor, defaultBadgeColor),
      }),
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<InvestIdeasSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
  }

  selectInstrument(instrumentKey: InstrumentKey): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext.selectInstrument(instrumentKey, s.badgeColor ?? defaultBadgeColor);
    });
  }
}
