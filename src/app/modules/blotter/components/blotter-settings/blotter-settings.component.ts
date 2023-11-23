import {
  Component,
  DestroyRef,
  OnInit,
} from '@angular/core';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import {
  Observable,
  take
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
  allRepoTradesColumns,
  allStopOrdersColumns,
  allTradesColumns,
  allTradesHistoryColumns,
  BlotterSettings
} from '../../models/blotter-settings.model';
import { DeviceService } from "../../../../shared/services/device.service";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import { WidgetSettingsBaseComponent } from "../../../../shared/components/widget-settings/widget-settings-base.component";
import { ManageDashboardsService } from "../../../../shared/services/manage-dashboards.service";

@Component({
  selector: 'ats-blotter-settings',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less']
})
export class BlotterSettingsComponent extends WidgetSettingsBaseComponent<BlotterSettings> implements OnInit {
  form?: UntypedFormGroup;
  allOrdersColumns: BaseColumnId[] = allOrdersColumns;
  allStopOrdersColumns: BaseColumnId[] = allStopOrdersColumns;
  allTradesColumns: BaseColumnId[] = allTradesColumns;
  allTradesHistoryColumns: BaseColumnId[] = allTradesHistoryColumns;
  allRepoTradesColumns: BaseColumnId[] = allRepoTradesColumns;
  allPositionsColumns: BaseColumnId[] = allPositionsColumns;
  allNotificationsColumns: BaseColumnId[] = allNotificationsColumns;
  prevSettings?: BlotterSettings;
  exchanges: string[] = exchangesList;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  deviceInfo$!: Observable<any>;

  protected settings$!: Observable<BlotterSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly manageDashboardsService: ManageDashboardsService,
    private readonly store: Store,
    private readonly deviceService: DeviceService,
    private readonly destroyRef: DestroyRef
  ) {
    super(settingsService, manageDashboardsService);
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form?.valid ?? false;
  }

  ngOnInit(): void {
    this.initSettingsStream();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      this.prevSettings = settings;

      this.form = new UntypedFormGroup({
        portfolio: new UntypedFormControl(this.toPortfolioKey(settings), Validators.required),
        exchange: new UntypedFormControl({value: settings.exchange, disabled: true}, Validators.required),
        ordersColumns: new UntypedFormControl(this.toTableSettings(settings.ordersTable, settings.ordersColumns)?.columns.map(c => c.columnId)),
        stopOrdersColumns: new UntypedFormControl(this.toTableSettings(settings.stopOrdersTable, settings.stopOrdersColumns)?.columns.map(c => c.columnId)),
        tradesColumns: new UntypedFormControl(this.toTableSettings(settings.tradesTable, settings.tradesColumns)?.columns.map(c => c.columnId)),
        positionsColumns: new UntypedFormControl(this.toTableSettings(settings.positionsTable, settings.positionsColumns)?.columns.map(c => c.columnId)),
        notificationsColumns: new UntypedFormControl(
          this.toTableSettings(
            settings.notificationsTable,
            allNotificationsColumns.filter(c => c.isDefault).map(x => x.id)
          )?.columns.map(c => c.columnId)
        ),
        isSoldPositionsHidden: new UntypedFormControl((settings.isSoldPositionsHidden as boolean | undefined) ?? false),
        cancelOrdersWithoutConfirmation: new UntypedFormControl(settings.cancelOrdersWithoutConfirmation ?? false),
        showRepoTrades: new UntypedFormControl(settings.showRepoTrades ?? false),
        repoTradesColumns: new UntypedFormControl(this.toTableSettings(settings.repoTradesTable)?.columns.map(c => c.columnId)),
        tradesHistoryColumns: new UntypedFormControl(this.toTableSettings(
          settings.tradesHistoryTable,
          this.allTradesHistoryColumns.filter(c => c.isDefault).map(c => c.id)
        )?.columns.map(c => c.columnId)),
        showPositionActions: new UntypedFormControl(settings.showPositionActions ?? false)
      });
    });

    this.availablePortfolios$ = this.store.select(selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x)))
    );
  }

  portfolioChanged(portfolio: string): void {
    this.form!.controls.exchange.setValue(this.getPortfolioKey(portfolio).exchange);
  }

  toPortfolioKey(portfolio: {portfolio: string, exchange: string}): string {
    return `${portfolio.portfolio}:${portfolio.exchange}`;
  }

  protected getUpdatedSettings(initialSettings: BlotterSettings): Partial<BlotterSettings> {
    const portfolio = this.getPortfolioKey(this.form!.value.portfolio);

    const newSettings = {
      ...this.form!.value,
      portfolio: portfolio.portfolio,
      exchange: portfolio.exchange
    } as Partial<BlotterSettings & { tradesHistoryColumns?: string[], repoTradesColumns?: string[], notificationsColumns?: string[] }>;

    newSettings.ordersTable = this.updateTableSettings(newSettings.ordersColumns ?? [], initialSettings.ordersTable);
    delete newSettings.ordersColumns;
    newSettings.stopOrdersTable = this.updateTableSettings(newSettings.stopOrdersColumns ?? [], initialSettings.stopOrdersTable);
    delete newSettings.stopOrdersColumns;
    newSettings.tradesTable = this.updateTableSettings(newSettings.tradesColumns ?? [], initialSettings.tradesTable);
    delete newSettings.tradesColumns;
    newSettings.tradesHistoryTable = this.updateTableSettings(newSettings.tradesHistoryColumns ?? [], initialSettings.tradesHistoryTable);
    delete newSettings.tradesHistoryColumns;
    newSettings.repoTradesTable = this.updateTableSettings(newSettings.repoTradesColumns ?? [], initialSettings.repoTradesTable);
    delete newSettings.tradesColumns;
    newSettings.positionsTable = this.updateTableSettings(newSettings.positionsColumns ?? [], initialSettings.positionsTable);
    delete newSettings.positionsColumns;

    newSettings.notificationsTable = this.updateTableSettings(newSettings.notificationsColumns ?? [], initialSettings.notificationsTable);
    delete newSettings.notificationsColumns;

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && this.isPortfolioEqual(initialSettings, newSettings as BlotterSettings);

    return newSettings;
  }

  private isPortfolioEqual(settings1: BlotterSettings, settings2: BlotterSettings): boolean {
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
