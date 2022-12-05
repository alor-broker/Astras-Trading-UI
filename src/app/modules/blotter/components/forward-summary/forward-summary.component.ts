import {
  Component,
  EventEmitter,
  Input,
  OnInit
} from '@angular/core';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import {
  distinctUntilChanged,
  Observable,
  Subscription,
  switchMap
} from "rxjs";
import { BlotterService } from "../../services/blotter.service";
import { ForwardRisksView } from "../../models/forward-risks-view.model";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { CurrencyInstrument } from "../../../../shared/models/enums/currencies.model";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";

@Component({
  selector: 'ats-forward-summary[guid][resize]',
  templateUrl: './forward-summary.component.html',
  styleUrls: ['./forward-summary.component.less']
})
export class ForwardSummaryComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;

  summary$!: Observable<ForwardRisksView>;

  columns: number = 1;

  private resizeSub?: Subscription;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly service: BlotterService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  ngOnInit(): void {
    this.summary$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      distinctUntilChanged((previous, current) => isEqualBlotterSettings(previous, current)),
      mapWith(
        () => this.terminalSettingsService.getSettings(),
        (blotterSettings, ts) => {
          const portfolioCurrency = ts.portfoliosCurrency?.find(pc =>
            pc.portfolio.portfolio === blotterSettings.portfolio && pc.portfolio.exchange === blotterSettings.exchange
          );
          if (portfolioCurrency) {
            return {
              blotterSettings,
              currency: portfolioCurrency.currency
            };
          }

          return {
            blotterSettings,
            currency: blotterSettings.exchange === 'MOEX' ? CurrencyInstrument.RUB : CurrencyInstrument.USD
          };
        }
      ),
      switchMap(data => this.service.getForwardRisks(data.blotterSettings, data.currency))
    );

    this.resizeSub = this.resize.subscribe(i => {
      if (i.width) {
        if (i.width <= 600) {
          this.columns = 1;
        } else if (i.width < 900) {
          this.columns = 2;
        } else if (i.width < 1500) {
          this.columns = 3;
        } else {
          this.columns = 4;
        }
      }
    });
  }
}
