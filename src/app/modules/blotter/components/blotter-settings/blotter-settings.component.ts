import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {Observable, take} from "rxjs";
import {BaseColumnId, TableDisplaySettings} from '../../../../shared/models/settings/table-settings.model';
import {TableSettingHelper} from '../../../../shared/utils/table-setting.helper';
import {Store} from '@ngrx/store';
import {PortfolioExtended} from '../../../../shared/models/user/portfolio-extended.model';
import {filter, map, startWith} from 'rxjs/operators';
import {EntityStatus} from '../../../../shared/models/enums/entity-status';
import {groupPortfoliosByAgreement} from '../../../../shared/utils/portfolios';
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
import {DeviceService} from "../../../../shared/services/device.service";
import {
  WidgetSettingsBaseComponent
} from "../../../../shared/components/widget-settings/widget-settings-base.component";
import {ManageDashboardsService} from "../../../../shared/services/manage-dashboards.service";
import {PortfoliosFeature} from "../../../../store/portfolios/portfolios.reducer";
import {
  PUSH_NOTIFICATIONS_CONFIG,
  PushNotificationsConfig
} from "../../../push-notifications/services/push-notifications-config";
import {WidgetSettingsComponent} from '../../../../shared/components/widget-settings/widget-settings.component';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzFormControlComponent, NzFormDirective, NzFormItemComponent, NzFormLabelComponent} from 'ng-zorro-antd/form';
import {NzColDirective, NzRowDirective} from 'ng-zorro-antd/grid';
import {NzOptionComponent, NzOptionGroupComponent, NzSelectComponent} from 'ng-zorro-antd/select';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {RemoveSelectTitlesDirective} from '../../../../shared/directives/remove-select-titles.directive';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';

@Component({
  selector: 'ats-blotter-settings',
  templateUrl: './blotter-settings.component.html',
  styleUrls: ['./blotter-settings.component.less'],
  imports: [
    WidgetSettingsComponent,
    TranslocoDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormControlComponent,
    NzFormLabelComponent,
    NzSelectComponent,
    NzOptionGroupComponent,
    NzOptionComponent,
    NzInputDirective,
    NzDividerComponent,
    NzSwitchComponent,
    RemoveSelectTitlesDirective,
    NzTooltipDirective,
    AsyncPipe]
})
export class BlotterSettingsComponent extends WidgetSettingsBaseComponent<BlotterSettings> implements OnInit {
  protected readonly settingsService: WidgetSettingsService;
  protected readonly manageDashboardsService: ManageDashboardsService;
  protected readonly destroyRef: DestroyRef;
  private readonly store = inject(Store);
  private readonly deviceService = inject(DeviceService);
  private readonly formBuilder = inject(FormBuilder);
  readonly pushNotificationsConfig = inject<PushNotificationsConfig>(PUSH_NOTIFICATIONS_CONFIG);

  form = this.formBuilder.group({
    portfolio: this.formBuilder.nonNullable.control('', Validators.required),
    exchange: this.formBuilder.nonNullable.control(
      {
        value: '',
        disabled: true
      },
      Validators.required
    ),
    showSummary: this.formBuilder.nonNullable.control(true),
    showOrders: this.formBuilder.nonNullable.control(true),
    showStopOrders: this.formBuilder.nonNullable.control(true),
    showPositions: this.formBuilder.nonNullable.control(true),
    showTrades: this.formBuilder.nonNullable.control(true),
    showRepoTrades: this.formBuilder.nonNullable.control(false),
    showHistoryTrades: this.formBuilder.nonNullable.control(true),
    showNotifications: this.formBuilder.nonNullable.control(true),
    ordersColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    stopOrdersColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    positionsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    tradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    repoTradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    tradesHistoryColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    notificationsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    isSoldPositionsHidden: this.formBuilder.nonNullable.control(false),
    cancelOrdersWithoutConfirmation: this.formBuilder.nonNullable.control(false),
    showPositionActions: this.formBuilder.nonNullable.control(false),
  });

  allOrdersColumns: BaseColumnId[] = allOrdersColumns;
  allStopOrdersColumns: BaseColumnId[] = allStopOrdersColumns;
  allTradesColumns: BaseColumnId[] = allTradesColumns;
  allTradesHistoryColumns: BaseColumnId[] = allTradesHistoryColumns;
  allRepoTradesColumns: BaseColumnId[] = allRepoTradesColumns;
  allPositionsColumns: BaseColumnId[] = allPositionsColumns;
  allNotificationsColumns: BaseColumnId[] = allNotificationsColumns;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;
  deviceInfo$!: Observable<any>;

  protected settings$!: Observable<BlotterSettings>;

  constructor() {
    const settingsService = inject(WidgetSettingsService);
    const manageDashboardsService = inject(ManageDashboardsService);
    const destroyRef = inject(DestroyRef);

    super(settingsService, manageDashboardsService, destroyRef);

    this.settingsService = settingsService;
    this.manageDashboardsService = manageDashboardsService;
    this.destroyRef = destroyRef;
  }

  get showCopy(): boolean {
    return true;
  }

  get canSave(): boolean {
    return this.form.valid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.availablePortfolios$ = this.store.select(PortfoliosFeature.selectPortfoliosState).pipe(
      filter(p => p.status === EntityStatus.Success),
      map(portfolios => groupPortfoliosByAgreement(Object.values(portfolios.entities).filter((x): x is PortfolioExtended => !!x))),
      startWith(new Map())
    );
  }

  portfolioChanged(portfolio: string): void {
    this.form!.controls.exchange.setValue(this.getPortfolioKey(portfolio).exchange);
  }

  toPortfolioKey(portfolio: { portfolio: string, exchange: string }): string {
    return `${portfolio.portfolio}:${portfolio.exchange}`;
  }

  protected getUpdatedSettings(initialSettings: BlotterSettings): Partial<BlotterSettings> {
    const portfolio = this.getPortfolioKey(this.form.value.portfolio!);

    const newSettings = {
      ...this.form.value,
      portfolio: portfolio.portfolio,
      exchange: portfolio.exchange
    } as Partial<BlotterSettings & {
      tradesHistoryColumns?: string[];
      repoTradesColumns?: string[];
      notificationsColumns?: string[];
    }>;

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

  protected setCurrentFormValues(settings: BlotterSettings): void {
    this.form.reset();

    this.form.controls.portfolio.setValue(this.toPortfolioKey(settings));
    this.form.controls.exchange.setValue(settings.exchange);

    this.form.controls.showSummary.setValue(settings.showSummary ?? true);
    this.form.controls.showOrders.setValue(settings.showOrders ?? true);
    this.form.controls.showStopOrders.setValue(settings.showStopOrders ?? true);
    this.form.controls.showPositions.setValue(settings.showPositions ?? true);
    this.form.controls.showTrades.setValue(settings.showTrades ?? true);
    this.form.controls.showRepoTrades.setValue(settings.showRepoTrades ?? false);
    this.form.controls.showHistoryTrades.setValue(settings.showHistoryTrades ?? true);
    this.form.controls.showNotifications.setValue(settings.showNotifications ?? true);

    this.form.controls.ordersColumns.setValue(TableSettingHelper.toTableDisplaySettings(
      settings.ordersTable,
      settings.ordersColumns
    )?.columns.map(c => c.columnId) ?? []);

    this.form.controls.stopOrdersColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.stopOrdersTable,
        settings.stopOrdersColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.positionsColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.positionsTable,
        settings.positionsColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.tradesColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.tradesTable,
        settings.tradesColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.showRepoTrades.setValue(settings.showRepoTrades ?? false);
    this.form.controls.repoTradesColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.repoTradesTable,
        this.allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.tradesHistoryColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.tradesHistoryTable,
        this.allTradesHistoryColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.notificationsColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.notificationsTable,
        this.allNotificationsColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.isSoldPositionsHidden.setValue(settings.isSoldPositionsHidden);
    this.form.controls.cancelOrdersWithoutConfirmation.setValue(settings.cancelOrdersWithoutConfirmation ?? false);
    this.form.controls.showPositionActions.setValue(settings.showPositionActions ?? false);
  }

  private isPortfolioEqual(settings1: BlotterSettings, settings2: BlotterSettings): boolean {
    return settings1.portfolio === settings2.portfolio
      && settings1.exchange === settings2.exchange;
  }

  private updateTableSettings(columnIds: string[], currentSettings?: TableDisplaySettings): TableDisplaySettings {
    const newSettings = TableSettingHelper.toTableDisplaySettings(null, columnIds)!;

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

  private getPortfolioKey(portfolio: string): { portfolio: string, exchange: string } {
    const parts = portfolio.split(':');
    return {
      portfolio: parts[0],
      exchange: parts[1]
    };
  }
}
