import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  of,
  Subscription,
  switchMap
} from 'rxjs';
import { DashboardItem } from 'src/app/shared/models/dashboard-item.model';
import { CommonSummaryView } from '../../models/common-summary-view.model';
import { BlotterService } from '../../services/blotter.service';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterSettings } from "../../../../shared/models/settings/blotter-settings.model";
import { isEqualBlotterSettings } from "../../../../shared/utils/settings-helper";
import { TerminalSettingsService } from "../../../terminal-settings/services/terminal-settings.service";
import { mapWith } from "../../../../shared/utils/observable-helper";
import { CurrencyInstrument } from "../../../../shared/models/enums/currencies.model";

@Component({
  selector: 'ats-common-summary[guid][resize]',
  templateUrl: './common-summary.component.html',
  styleUrls: ['./common-summary.component.less']
})
export class CommonSummaryComponent implements OnInit {
  @Input()
  shouldShowSettings!: boolean;
  @Input()
  guid!: string;
  @Input()
  resize!: EventEmitter<DashboardItem>;
  @Output()
  shouldShowSettingsChange = new EventEmitter<boolean>();

  summary$: Observable<CommonSummaryView> = of();

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
      switchMap(data => this.service.getCommonSummary(data.blotterSettings, data.currency))
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
