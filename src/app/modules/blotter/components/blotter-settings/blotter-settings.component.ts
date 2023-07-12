import {
  Component, DestroyRef,
  EventEmitter,
  Input,
  OnInit,
  Output
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  shareReplay,
  take,
} from "rxjs";
import { exchangesList } from "../../../../shared/models/enums/exchanges";
import { BaseColumnId, TableDisplaySettings } from '../../../../shared/models/settings/table-settings.model';
import { TableSettingHelper } from '../../../../shared/utils/table-setting.helper';
import { Store } from '@ngrx/store';
import { PortfolioExtended } from '../../../../shared/models/user/portfolio-extended.model';
import { selectPortfoliosState } from '../../../../store/portfolios/portfolios.selectors';
import {
  filter,
  map
} from 'rxjs/operators';
import { EntityStatus } from '../../../../shared/models/enums/entity-status';
import { groupPortfoliosByAgreement } from '../../../../shared/utils/portfolios';
import {
  allNotificationsColumns,
  allOrdersColumns,
  allPositionsColumns,
  allStopOrdersColumns,
  allTradesColumns,
  BlotterSettings
} from '../../models/blotter-settings.model';
import { DeviceService } from "../../../../shared/services/device.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-blotter-settings[guid]',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent implements OnInit {
  @Input()
  guid!: string;
  @Output()
  settingsChange: EventEmitter<BlotterSettings> = new EventEmitter<BlotterSettings>();
  form!: UntypedFormGroup;
  allOrdersColumns: BaseColumnId[] = allOrdersColumns;
  allStopOrdersColumns: BaseColumnId[] = allStopOrdersColumns;
  allTradesColumns: BaseColumnId[] = allTradesColumns;
  allPositionsColumns: BaseColumnId[] = allPositionsColumns;
  allNotificationsColumns: BaseColumnId[] = allNotificationsColumns;
  prevSettings?: BlotterSettings;
  exchanges: string[] = exchangesList;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  deviceInfo$!: Observable<any>;

  private settings$!: Observable<BlotterSettings>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly store: Store,
    private readonly deviceService: DeviceService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid).pipe(
      shareReplay(1)
    );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      if (settings) {
        this.prevSettings = settings;

        this.form = new UntypedFormGroup({
          portfolio: new UntypedFormControl(this.toPortfolioKey(settings), Validators.required),
          exchange: new UntypedFormControl({ value: settings.exchange, disabled: true }, Validators.required),
          ordersColumns: new UntypedFormControl(this.toTableSettings(settings.ordersTable, settings.ordersColumns)?.columns?.map(c => c.columnId)),
          stopOrdersColumns: new UntypedFormControl(this.toTableSettings(settings.stopOrdersTable, settings.stopOrdersColumns)?.columns?.map(c => c.columnId)),
          tradesColumns: new UntypedFormControl(this.toTableSettings(settings.tradesTable, settings.tradesColumns)?.columns?.map(c => c.columnId)),
          positionsColumns: new UntypedFormControl(this.toTableSettings(settings.positionsTable, settings.positionsColumns)?.columns?.map(c => c.columnId)),
          notificationsColumns: new UntypedFormControl(
            this.toTableSettings(
              settings.notificationsTable,
              allNotificationsColumns.filter(c => c.isDefault).map(x => x.id)
            )?.columns?.map(c => c.columnId)
          ),
          isSoldPositionsHidden: new UntypedFormControl(settings.isSoldPositionsHidden ?? false),
          cancelOrdersWithoutConfirmation: new UntypedFormControl(settings.cancelOrdersWithoutConfirmation ?? false)
        });
      }
    });

    this.availablePortfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x)))
    );
  }

  portfolioChanged(portfolio: string) {
    this.form.controls.exchange.setValue(this.getPortfolioKey(portfolio).exchange);
  }

  submitForm(): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(initialSettings => {
      const portfolio = this.getPortfolioKey(this.form.value.portfolio);

      const newSettings = {
        ...this.form.value,
        portfolio: portfolio.portfolio,
        exchange: portfolio.exchange
      };

      newSettings.ordersTable = this.updateTableSettings(newSettings.ordersColumns, initialSettings.ordersTable);
      delete newSettings.ordersColumns;
      newSettings.stopOrdersTable = this.updateTableSettings(newSettings.stopOrdersColumns, initialSettings.stopOrdersTable);
      delete newSettings.stopOrdersColumns;
      newSettings.tradesTable = this.updateTableSettings(newSettings.tradesColumns, initialSettings.tradesTable);
      delete newSettings.tradesColumns;
      newSettings.positionsTable = this.updateTableSettings(newSettings.positionsColumns, initialSettings.positionsTable);
      delete newSettings.positionsColumns;

      newSettings.notificationsTable = this.updateTableSettings(newSettings.notificationsColumns, initialSettings.notificationsTable);
      delete newSettings.notificationsColumns;

      newSettings.linkToActive = initialSettings.linkToActive && this.isPortfolioEqual(initialSettings, newSettings);

      this.settingsService.updateSettings<BlotterSettings>(this.guid, newSettings);
      this.settingsChange.emit();
    });
  }

  toPortfolioKey(portfolio: {portfolio: string, exchange: string}): string {
    return `${portfolio.portfolio}:${portfolio.exchange}`;
  }

  private isPortfolioEqual(settings1: BlotterSettings, settings2: BlotterSettings) {
    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }

  private toTableSettings(tableSettings?: TableDisplaySettings | null, columnIds?: string[]): TableDisplaySettings | undefined {
    if (tableSettings) {
      return tableSettings;
    }

    if (columnIds) {
      return TableSettingHelper.toTableDisplaySettings(columnIds);
    }

    return undefined;
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = this.toTableSettings(null, columnIds)!;

    if (currentSettings) {
      newSettings.columns.forEach((column, index) => {
        const matchedColumn = currentSettings!.columns.find(x => x.columnId === column.columnId);
        if (matchedColumn) {
          newSettings.columns[index] = {
            ...column,
            ...matchedColumn
          };
        }
      });
    }

    return newSettings!;
  }
  private getPortfolioKey(portfolio: string): {portfolio: string, exchange: string} {
    const parts = portfolio.split(':');
    return {
      portfolio: parts[0],
      exchange: parts[1]
    };
  }
}
