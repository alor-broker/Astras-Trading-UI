import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Observable,
  shareReplay
} from "rxjs";
import {
  map,
  startWith
} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzOptionComponent,
  NzOptionGroupComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {RemoveSelectTitles} from '@terminal-core-lib/common/directives/remove-select-titles';
import {WidgetSettingsBase} from '@terminal-widgets-lib/common/widget-settings.base';
import {
  allNotificationsColumns,
  allOrdersColumns,
  allPositionsColumns,
  allRepoTradesColumns,
  allStopOrdersColumns,
  allTradesColumns,
  allTradesHistoryColumns,
  BlotterWidgetSettings
} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {USER_CONTEXT} from '@terminal-core-lib/features/user-context/user-context.types';
import {PUSH_NOTIFICATIONS_CONFIG} from '@terminal-core-lib/features/push-notifications/types/push-notifications-config.types';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {PortfolioExtended} from '@terminal-core-lib/common/types/portfolio.types';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {PortfolioHelper} from '@terminal-core-lib/common/utils/portfolio.helper';
import {
  Permission,
  User
} from '@terminal-core-lib/features/user-context/user.types';
import {PermissionsHelper} from '@terminal-core-lib/features/user-context/utils/permissions.helper';
import {TableSettingHelper} from '@terminal-core-lib/features/tables/utils/table-settings.helper';
import {SettingsDeviceVisible} from '@terminal-widgets-lib/common/features/settings-editor/directives/widget-settings-device-visible.directive';
import {SettingsDeviceVisibility} from '@terminal-widgets-lib/common/features/settings-editor/types/widget-settings-visibility.types';
import {WidgetInstance} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {WidgetSettingsSwitch} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-switch/widget-settings-switch';
import {WidgetSettingsFormItem} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form-item/widget-settings-form-item';
import {WidgetSettingsForm} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-form/widget-settings-form';
import {WidgetSettingsGroup} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-group/widget-settings-group';
import {WidgetSettingsEditor} from '@terminal-widgets-lib/common/features/settings-editor/components/widget-settings-editor/widget-settings-editor';

@Component({
  selector: 'ats-blotter-settings',
  templateUrl: './blotter-settings.html',
  imports: [
    WidgetSettingsEditor,
    WidgetSettingsGroup,
    WidgetSettingsForm,
    WidgetSettingsFormItem,
    WidgetSettingsSwitch,
    SettingsDeviceVisible,
    TranslocoDirective,
    ReactiveFormsModule,
    NzSelectComponent,
    NzOptionGroupComponent,
    NzOptionComponent,
    NzInputDirective,
    RemoveSelectTitles,
    NzTooltipDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterSettings extends WidgetSettingsBase<BlotterWidgetSettings> implements OnInit {
  readonly widgetInstance = input.required<WidgetInstance>();

  readonly DeviceVisibility = SettingsDeviceVisibility;

  readonly pushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

  allOrdersColumns: BaseColumnId[] = allOrdersColumns;

  allStopOrdersColumns: BaseColumnId[] = allStopOrdersColumns;

  allTradesColumns: BaseColumnId[] = allTradesColumns;

  allTradesHistoryColumns: BaseColumnId[] = allTradesHistoryColumns;

  allRepoTradesColumns: BaseColumnId[] = allRepoTradesColumns;

  allPositionsColumns: BaseColumnId[] = allPositionsColumns;

  allNotificationsColumns: BaseColumnId[] = allNotificationsColumns;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  protected readonly userContext = inject(USER_CONTEXT);

  protected settings$!: Observable<BlotterWidgetSettings>;

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    general: this.formBuilder.group({
      portfolio: this.formBuilder.nonNullable.control('', Validators.required),
      exchange: this.formBuilder.nonNullable.control(
        {
          value: '',
          disabled: true
        },
        Validators.required
      ),
      showSummary: this.formBuilder.nonNullable.control(true),
    }),
    orders: this.formBuilder.group({
      showOrders: this.formBuilder.nonNullable.control(true),
      ordersColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      showStopOrders: this.formBuilder.nonNullable.control(true),
      stopOrdersColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      cancelOrdersWithoutConfirmation: this.formBuilder.nonNullable.control(false),
    }),
    positions: this.formBuilder.group({
      showPositions: this.formBuilder.nonNullable.control(true),
      positionsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      showPositionActions: this.formBuilder.nonNullable.control(false),
      isSoldPositionsHidden: this.formBuilder.nonNullable.control(false),
    }),
    trades: this.formBuilder.group({
      showTrades: this.formBuilder.nonNullable.control(true),
      tradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      showRepoTrades: this.formBuilder.nonNullable.control(false),
      repoTradesColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
      showHistoryTrades: this.formBuilder.nonNullable.control(true),
      tradesHistoryColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    }),
    notifications: this.formBuilder.group({
      showNotifications: this.formBuilder.nonNullable.control(true),
      notificationsColumns: this.formBuilder.nonNullable.control<string[]>([], Validators.required),
    }),
  });

  override get canSave(): boolean {
    return this.form.valid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.availablePortfolios$ = this.portfoliosStoreFacade.portfolios$.pipe(
      map(portfolios => PortfolioHelper.groupPortfoliosByAgreement(portfolios)),
      startWith(new Map()),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  portfolioChanged(portfolio: string | null): void {
    this.form.controls.general.controls.exchange.setValue(this.getPortfolioKey(portfolio ?? '').exchange);
  }

  toPortfolioKey(portfolio: { portfolio: string, exchange: string }): string {
    return `${portfolio.portfolio}:${portfolio.exchange}`;
  }

  protected canCancelOrders(user: User): boolean {
    return PermissionsHelper.hasPermission(user, Permission.CancelOrder);
  }

  protected canChangePositions(user: User): boolean {
    return PermissionsHelper.hasPermission(user, Permission.ClosePosition)
      || PermissionsHelper.hasPermission(user, Permission.ReversePosition);
  }

  protected getUpdatedSettings(initialSettings: BlotterWidgetSettings): Partial<BlotterWidgetSettings> {
    const value = this.form.getRawValue();
    const portfolio = this.getPortfolioKey(value.general.portfolio);

    return {
      ...portfolio,
      showSummary: value.general.showSummary,
      showOrders: value.orders.showOrders,
      showStopOrders: value.orders.showStopOrders,
      cancelOrdersWithoutConfirmation: value.orders.cancelOrdersWithoutConfirmation,
      showPositions: value.positions.showPositions,
      showPositionActions: value.positions.showPositionActions,
      isSoldPositionsHidden: value.positions.isSoldPositionsHidden,
      showTrades: value.trades.showTrades,
      showRepoTrades: value.trades.showRepoTrades,
      showHistoryTrades: value.trades.showHistoryTrades,
      showNotifications: value.notifications.showNotifications,
      ordersTable: this.updateTableSettings(value.orders.ordersColumns, initialSettings.ordersTable),
      stopOrdersTable: this.updateTableSettings(value.orders.stopOrdersColumns, initialSettings.stopOrdersTable),
      positionsTable: this.updateTableSettings(value.positions.positionsColumns, initialSettings.positionsTable),
      tradesTable: this.updateTableSettings(value.trades.tradesColumns, initialSettings.tradesTable),
      repoTradesTable: this.updateTableSettings(value.trades.repoTradesColumns, initialSettings.repoTradesTable),
      tradesHistoryTable: this.updateTableSettings(value.trades.tradesHistoryColumns, initialSettings.tradesHistoryTable),
      notificationsTable: this.updateTableSettings(value.notifications.notificationsColumns, initialSettings.notificationsTable),
      linkToActive: (initialSettings.linkToActive ?? false) && this.isPortfolioEqual(initialSettings, portfolio)
    };
  }

  protected setCurrentFormValues(settings: BlotterWidgetSettings): void {
    this.form.reset();

    this.form.controls.general.controls.portfolio.setValue(this.toPortfolioKey(settings));
    this.form.controls.general.controls.exchange.setValue(settings.exchange);

    this.form.controls.general.controls.showSummary.setValue(settings.showSummary ?? true);
    this.form.controls.orders.controls.showOrders.setValue(settings.showOrders ?? true);
    this.form.controls.orders.controls.showStopOrders.setValue(settings.showStopOrders ?? true);
    this.form.controls.positions.controls.showPositions.setValue(settings.showPositions ?? true);
    this.form.controls.trades.controls.showTrades.setValue(settings.showTrades ?? true);
    this.form.controls.trades.controls.showRepoTrades.setValue(settings.showRepoTrades ?? false);
    this.form.controls.trades.controls.showHistoryTrades.setValue(settings.showHistoryTrades ?? true);
    this.form.controls.notifications.controls.showNotifications.setValue(settings.showNotifications ?? true);

    this.form.controls.orders.controls.ordersColumns.setValue(TableSettingHelper.toTableDisplaySettings(
      settings.ordersTable,
      settings.ordersColumns
    )?.columns.map(c => c.columnId) ?? []);

    this.form.controls.orders.controls.stopOrdersColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.stopOrdersTable,
        settings.stopOrdersColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.positions.controls.positionsColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.positionsTable,
        settings.positionsColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.trades.controls.tradesColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.tradesTable,
        settings.tradesColumns
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.trades.controls.repoTradesColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.repoTradesTable,
        this.allRepoTradesColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.trades.controls.tradesHistoryColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.tradesHistoryTable,
        this.allTradesHistoryColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.notifications.controls.notificationsColumns.setValue(
      TableSettingHelper.toTableDisplaySettings(
        settings.notificationsTable,
        this.allNotificationsColumns.filter(c => c.isDefault).map(c => c.id)
      )?.columns.map(c => c.columnId) ?? []
    );

    this.form.controls.positions.controls.isSoldPositionsHidden.setValue(settings.isSoldPositionsHidden ?? true);
    this.form.controls.orders.controls.cancelOrdersWithoutConfirmation.setValue(settings.cancelOrdersWithoutConfirmation ?? false);
    this.form.controls.positions.controls.showPositionActions.setValue(settings.showPositionActions ?? false);
  }

  private isPortfolioEqual(settings1: BlotterWidgetSettings, settings2: { portfolio: string, exchange: string }): boolean {
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
      exchange: parts[1] ?? ''
    };
  }
}
