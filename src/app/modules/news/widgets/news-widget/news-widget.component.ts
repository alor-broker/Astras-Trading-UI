import {
  Component,
  Input,
  OnInit
} from '@angular/core';
import { WidgetSettingsService } from '../../../../shared/services/widget-settings.service';
import { WidgetSettingsCreationHelper } from '../../../../shared/utils/widget-settings/widget-settings-creation-helper';
import { NewsSettings } from '../../models/news-settings.model';
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { Observable, of, switchMap } from "rxjs";
import { SettingsHelper } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { NewsSection } from "../../models/news.model";
import { map } from "rxjs/operators";
import { InstrumentsService } from "../../../instruments/services/instruments.service";
import {WidgetInstance} from "../../../../shared/models/dashboard/dashboard-item.model";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {WidgetsHelper} from "../../../../shared/utils/widgets";

@Component({
  selector: 'ats-news-widget[widgetInstance][isBlockWidget]',
  templateUrl: './news-widget.component.html',
  styleUrls: ['./news-widget.component.less']
})
export class NewsWidgetComponent implements OnInit {
  @Input()
  widgetInstance!: WidgetInstance;

  @Input()
  isBlockWidget!: boolean;
  settings$!: Observable<NewsSettings>;
  showBadge$!: Observable<boolean>;
  widgetTitle$: Observable<string> = of('');
  titleText!: string;

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly dashboardService: DashboardContextService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly translatorService: TranslatorService
  ) {
  }

  get guid(): string {
    return this.widgetInstance.instance.guid;
  }

  ngOnInit(): void {
    WidgetSettingsCreationHelper.createInstrumentLinkedWidgetSettingsIfMissing<NewsSettings>(
      this.widgetInstance,
      'NewsSettings',
      settings => ({
        ...settings
      }),
      this.dashboardService,
      this.widgetSettingsService
    );

    this.settings$ = this.widgetSettingsService.getSettings<NewsSettings>(this.guid);
    this.showBadge$ = SettingsHelper.showBadge(this.guid, this.widgetSettingsService, this.terminalSettingsService);
    this.titleText =  WidgetsHelper.getWidgetName(this.widgetInstance.widgetMeta.widgetName, this.translatorService.getActiveLang());
  }

  sectionChange(section: NewsSection) {
    switch (section) {
      case NewsSection.All:
        this.widgetTitle$ = of('');
        break;
      case NewsSection.Portfolio:
        this.widgetTitle$ = this.dashboardService.selectedPortfolio$
          .pipe(
            map(p => `${p.portfolio} (${p.exchange})`)
          );
        break;
      case NewsSection.Symbol:
        this.widgetTitle$ = this.settings$
          .pipe(
            switchMap(s => this.instrumentsService.getInstrument({
              symbol: s.symbol,
              exchange: s.exchange,
              instrumentGroup: s.instrumentGroup
            })),
            map(i => `${i!.symbol} ${i!.instrumentGroup ? '(' + i!.instrumentGroup + ')' : ''} ${i!.shortName}`)
          );
        break;
    }
  }
}
