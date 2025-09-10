import {
  Component,
  DestroyRef,
  Input,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';
import { SelectClientPortfolioBtnComponent } from "../../../../admin/components/select-client-portfolio-btn/select-client-portfolio-btn.component";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { AdminClientsService } from "../../services/clients/admin-clients.service";
import {
  Client,
  ClientsSearchFilter,
  SpectraExtension
} from "../../services/clients/admin-clients-service.models";
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  shareReplay,
  switchMap,
  tap,
  timer
} from "rxjs";
import { TableConfig } from "../../../../shared/models/table-config.model";
import { AdminClientsSettings, } from "../../models/admin-clients-settings.model";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { WidgetLocalStateService } from "../../../../shared/services/widget-local-state.service";
import { map } from "rxjs/operators";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

type ClientDisplay = Omit<Client, 'spectraExtension'> | SpectraExtension;

@Component({
  selector: 'ats-admin-clients',
  standalone: true,
  imports: [
    SelectClientPortfolioBtnComponent
  ],
  templateUrl: './admin-clients.component.html',
  styleUrl: './admin-clients.component.less'
})
export class AdminClientsComponent extends BaseTableComponent<ClientDisplay, ClientsSearchFilter> implements OnInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  allColumns: BaseColumnSettings<ClientDisplay>[] = [
    {
      id: "login",
      displayName: ""
    },
    {
      id: "clientName",
      displayName: ""
    },
    {
      id: "portfolio",
      displayName: ""
    },
    {
      id: "market",
      displayName: ""
    },
    {
      id: "clientRiskType",
      displayName: ""
    },
    {
      id: "isQualifiedInvestor",
      displayName: ""
    },
    {
      id: "buyingPowerAtMorning",
      displayName: ""
    },
    {
      id: "buyingPower",
      displayName: ""
    },
    {
      id: "profit",
      displayName: ""
    },
    {
      id: "profitRate",
      displayName: ""
    },
    {
      id: "portfolioEvaluation",
      displayName: ""
    },
    {
      id: "portfolioLiquidationValue",
      displayName: ""
    },
    {
      id: "initialMargin",
      displayName: ""
    },
    {
      id: "minimalMargin",
      displayName: ""
    },
    {
      id: "riskBeforeForcePositionClosing",
      displayName: ""
    },
    {
      id: "commission",
      displayName: ""
    },
    {
      id: "correctedMargin",
      displayName: ""
    },
    {
      id: "turnover",
      displayName: ""
    },
    {
      id: "moneyFree",
      displayName: ""
    },
    {
      id: "moneyOld",
      displayName: ""
    },
    {
      id: "moneyBlocked",
      displayName: ""
    },
    {
      id: "isLimitsSet",
      displayName: ""
    },
    {
      id: "moneyAmount",
      displayName: ""
    },
    {
      id: "moneyPledgeAmount",
      displayName: ""
    },
    {
      id: "vmCurrentPositions",
      displayName: ""
    },
    {
      id: "varMargin",
      displayName: ""
    },
    {
      id: "netOptionValue",
      displayName: ""
    },
    {
      id: "indicativeVarMargin",
      displayName: ""
    },
    {
      id: "fee",
      displayName: ""
    },
    {
      id: "vmInterCl",
      displayName: ""
    },
    {
      id: "posRisk",
      displayName: ""
    }
  ];

  protected readonly allPageSizes = [15, 25, 50, 100];

  protected readonly page$ = new BehaviorSubject<{ page: number, pageSize: number }>({
    page: 0,
    pageSize: this.allPageSizes[0]
  });

  protected readonly isLoading = signal(false);
  protected readonly totalRecords = signal(0);

  private settings$!: Observable<AdminClientsSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef,
    private readonly adminClientsService: AdminClientsService,
    private readonly translatorService: TranslatorService,
    protected readonly widgetLocalStateService: WidgetLocalStateService,
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<AdminClientsSettings>(this.guid).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );

    super.ngOnInit();
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.page$.complete();
  }

  protected initTableDataStream(): Observable<ClientDisplay[]> {
    const refresh$ = this.settings$.pipe(
      switchMap(settings => timer(0, settings.refreshIntervalSec * 1000)),
      takeUntilDestroyed(this.destroyRef)
    );

    return combineLatest({
      refresh: refresh$,
      filters: this.filters$,
      sort: this.sort$,
      page: this.page$
    }).pipe(
      tap(() => {
        this.isLoading.set(true);
        this.totalRecords.set(0);
      }),
      switchMap(x => {

      }),
      tap(() => {
        this.isLoading.set(false);
      }),
    );
  }

  protected initTableConfigStream(): Observable<TableConfig<ClientDisplay>> {
    return combineLatest({
      settings: this.settings$,
      translator: this.translatorService.getTranslator('admin-clients/admin-clients')
    })
      .pipe(
        map(x => {
          const tableSettings = x.settings.table;

          return {
            columns: this.allColumns
              .map(column => ({column, settings: tableSettings.columns.find(c => c.columnId === column.id)}))
              .filter(c => c.settings != null)
              .map((col, index) => ({
                ...col.column,
                displayName: x.translator(['columns', col.column.id, 'displayName'], {fallback: col.column.displayName}),
                tooltip: x.translator(['columns', col.column.id, 'tooltip'], {fallback: col.column.tooltip}),
                order: col.settings!.columnOrder ?? TableSettingHelper.getDefaultColumnOrder(index),
                width: col.settings!.columnWidth ?? this.defaultColumnWidth
              }))
              .sort((a, b) => a.order - b.order)
          };
        })
      );
  }
}
