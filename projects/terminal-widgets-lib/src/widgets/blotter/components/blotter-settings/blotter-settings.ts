import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  Observable,
  shareReplay,
  take
} from "rxjs";
import {
  map,
  startWith
} from 'rxjs/operators';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';
import {
  NzOptionComponent,
  NzOptionGroupComponent,
  NzSelectComponent
} from 'ng-zorro-antd/select';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzDividerComponent} from 'ng-zorro-antd/divider';
import {NzSwitchComponent} from 'ng-zorro-antd/switch';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {AsyncPipe} from '@angular/common';
import {WidgetSettings} from '@terminal-widgets-lib/common/components/widget-settings/widget-settings';
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
import {DeviceService} from '@terminal-core-lib/common/services/device.service';
import {DeviceInfo} from '@terminal-core-lib/common/services/device-service-types';
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

@Component({
  selector: 'ats-blotter-settings',
  templateUrl: './blotter-settings.html',
  styleUrls: ['./blotter-settings.less'],
  imports: [
    WidgetSettings,
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
    RemoveSelectTitles,
    NzTooltipDirective,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class BlotterSettings extends WidgetSettingsBase<BlotterWidgetSettings> implements OnInit {
  readonly pushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

  allOrdersColumns: BaseColumnId[] = allOrdersColumns;

  allStopOrdersColumns: BaseColumnId[] = allStopOrdersColumns;

  allTradesColumns: BaseColumnId[] = allTradesColumns;

  allTradesHistoryColumns: BaseColumnId[] = allTradesHistoryColumns;

  allRepoTradesColumns: BaseColumnId[] = allRepoTradesColumns;

  allPositionsColumns: BaseColumnId[] = allPositionsColumns;

  allNotificationsColumns: BaseColumnId[] = allNotificationsColumns;

  availablePortfolios$!: Observable<Map<string, PortfolioExtended[]>>;

  deviceInfo$!: Observable<DeviceInfo>;

  protected readonly userContext = inject(USER_CONTEXT);

  protected settings$!: Observable<BlotterWidgetSettings>;

  private readonly portfoliosStoreFacade = inject(PortfoliosStoreFacade);

  private readonly deviceService = inject(DeviceService);

  private readonly formBuilder = inject(FormBuilder);

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

  override get canSave(): boolean {
    return this.form.valid;
  }

  get isNotificationsSupported(): boolean {
    return this.pushNotificationsConfig.portfolioOrdersExecuteNotifications.isSupported
      || this.pushNotificationsConfig.priceChangeNotifications.isSupported;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    this.deviceInfo$ = this.deviceService.deviceInfo$
      .pipe(
        take(1)
      );

    this.availablePortfolios$ = this.portfoliosStoreFacade.portfolios$.pipe(
      map(portfolios => PortfolioHelper.groupPortfoliosByAgreement(portfolios)),
      startWith(new Map()),
      shareReplay(1)
    );
  }

  portfolioChanged(portfolio: string): void {
    this.form!.controls.exchange.setValue(this.getPortfolioKey(portfolio).exchange);
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
    const portfolio = this.getPortfolioKey(this.form.value.portfolio!);

    const newSettings = {
      ...this.form.value,
      portfolio: portfolio.portfolio,
      exchange: portfolio.exchange
    } as Partial<BlotterWidgetSettings & {
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

    newSettings.linkToActive = (initialSettings.linkToActive ?? false) && this.isPortfolioEqual(initialSettings, newSettings as BlotterWidgetSettings);

    return newSettings;
  }

  protected setCurrentFormValues(settings: BlotterWidgetSettings): void {
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

  private isPortfolioEqual(settings1: BlotterWidgetSettings, settings2: BlotterWidgetSettings): boolean {
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
