import {Component, DestroyRef, Inject, Input, LOCALE_ID, OnDestroy, OnInit, signal} from '@angular/core';
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {AdminClientsService} from "../../services/clients/admin-clients.service";
import {Client, ClientsSearchFilter, SpectraExtension} from "../../services/clients/admin-clients-service.models";
import {BaseTableComponent} from "../../../../shared/components/base-table/base-table.component";
import {BehaviorSubject, combineLatest, Observable, shareReplay, switchMap, take, tap, timer} from "rxjs";
import {TableConfig} from "../../../../shared/models/table-config.model";
import {AdminClientsSettings,} from "../../models/admin-clients-settings.model";
import {TranslatorService} from "../../../../shared/services/translator.service";
import {map} from "rxjs/operators";
import {TableSettingHelper} from "../../../../shared/utils/table-setting.helper";
import {BaseColumnSettings} from "../../../../shared/models/settings/table-settings.model";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {NzTableCellDirective, NzTableComponent, NzThMeasureDirective, NzTrDirective} from "ng-zorro-antd/table";
import {LetDirective} from "@ngrx/component";
import {CdkDrag, CdkDropList} from "@angular/cdk/drag-drop";
import {SharedModule} from "../../../../shared/shared.module";
import {formatNumber} from "@angular/common";
import {TableRowHeightDirective} from "../../../../shared/directives/table-row-height.directive";

type ClientDisplay = Omit<Client, 'spectraExtension'> & Partial<SpectraExtension>;

@Component({
  selector: 'ats-admin-clients',
  standalone: true,
  imports: [
    NzResizeObserverDirective,
    NzTableComponent,
    LetDirective,
    CdkDropList,
    NzTrDirective,
    NzTableCellDirective,
    NzThMeasureDirective,
    SharedModule,
    CdkDrag,
    TableRowHeightDirective
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
      displayName: "",
      transformFn: data => data.login
    },
    {
      id: "clientName",
      displayName: "",
      transformFn: data => data.clientName
    },
    {
      id: "portfolio",
      displayName: "",
      transformFn: data => data.portfolio
    },
    {
      id: "market",
      displayName: "",
      transformFn: data => data.market
    },
    {
      id: "clientRiskType",
      displayName: "",
      transformFn: data => data.clientRiskType
    },
    {
      id: "isQualifiedInvestor",
      displayName: "",
      translatedTransformFn: (data, translator) => data.isQualifiedInvestor ? translator(['yes']) : translator(['no'])
    },
    {
      id: "buyingPowerAtMorning",
      displayName: "",
      transformFn: data => this.formatNumber(data.buyingPowerAtMorning)
    },
    {
      id: "buyingPower",
      displayName: "",
      transformFn: data => this.formatNumber(data.buyingPower)
    },
    {
      id: "profit",
      displayName: "",
      transformFn: data => this.formatNumber(data.profit)
    },
    {
      id: "profitRate",
      displayName: "",
      transformFn: data => this.formatNumber(data.profitRate)
    },
    {
      id: "portfolioEvaluation",
      displayName: "",
      transformFn: data => this.formatNumber(data.portfolioEvaluation)
    },
    {
      id: "portfolioLiquidationValue",
      displayName: "",
      transformFn: data => this.formatNumber(data.portfolioLiquidationValue)
    },
    {
      id: "initialMargin",
      displayName: "",
      transformFn: data => this.formatNumber(data.initialMargin)
    },
    {
      id: "minimalMargin",
      displayName: "",
      transformFn: data => this.formatNumber(data.minimalMargin)
    },
    {
      id: "riskBeforeForcePositionClosing",
      displayName: "",
      transformFn: data => this.formatNumber(data.riskBeforeForcePositionClosing)
    },
    {
      id: "commission",
      displayName: "",
      transformFn: data => this.formatNumber(data.commission)
    },
    {
      id: "correctedMargin",
      displayName: "",
      transformFn: data => this.formatNumber(data.correctedMargin)
    },
    {
      id: "turnover",
      displayName: "",
      transformFn: data => this.formatNumber(data.turnover)
    },
    {
      id: "moneyFree",
      displayName: "",
      transformFn: data => this.formatNumber(data.moneyFree)
    },
    {
      id: "moneyOld",
      displayName: "",
      transformFn: data => this.formatNumber(data.moneyOld)
    },
    {
      id: "moneyBlocked",
      displayName: "",
      transformFn: data => this.formatNumber(data.moneyBlocked)
    },
    {
      id: "isLimitsSet",
      displayName: "",
      translatedTransformFn: (data, translator) => {
        if (data.isLimitsSet != null) {
          return data.isLimitsSet ? translator(['yes']) : translator(['no'])
        }

        return '';
      }
    },
    {
      id: "moneyAmount",
      displayName: "",
      transformFn: data => this.formatNumber(data.moneyAmount)
    },
    {
      id: "moneyPledgeAmount",
      displayName: "",
      transformFn: data => this.formatNumber(data.moneyPledgeAmount)
    },
    {
      id: "vmCurrentPositions",
      displayName: "",
      transformFn: data => this.formatNumber(data.vmCurrentPositions)
    },
    {
      id: "varMargin",
      displayName: "",
      transformFn: data => this.formatNumber(data.varMargin)
    },
    {
      id: "netOptionValue",
      displayName: "",
      transformFn: data => this.formatNumber(data.netOptionValue)
    },
    {
      id: "indicativeVarMargin",
      displayName: "",
      transformFn: data => this.formatNumber(data.indicativeVarMargin)
    },
    {
      id: "fee",
      displayName: "",
      transformFn: data => this.formatNumber(data.fee)
    },
    {
      id: "vmInterCl",
      displayName: "",
      transformFn: data => this.formatNumber(data.vmInterCl)
    },
    {
      id: "posRisk",
      displayName: "",
      transformFn: data => this.formatNumber(data.posRisk)
    }
  ];

  protected readonly allPageSizes = [10, 25, 50, 100, 200, 500];

  protected readonly page$ = new BehaviorSubject<{ page: number, pageSize: number }>({
    page: 1,
    pageSize: this.allPageSizes[0]
  });

  protected readonly isLoading = signal(false);
  protected readonly totalRecords = signal(0);
  protected readonly valuesTranslator$ = this.translatorService.getTranslator('admin-clients/admin-clients').pipe(
    shareReplay(1)
  );
  private settings$!: Observable<AdminClientsSettings>;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef,
    private readonly adminClientsService: AdminClientsService,
    private readonly translatorService: TranslatorService,
    @Inject(LOCALE_ID)
    private readonly locale: string
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

  formatNumber(value: number | undefined): string {
    if (value != null) {
      return formatNumber(value, this.locale);
    }

    return '';
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
      }),
      switchMap(x => {
        return this.adminClientsService.searchClients(
          null,
          {
            page: x.page.page,
            pageSize: x.page.pageSize
          },
          null
        )
      }),
      map(result => {
          if (result == null) {
            this.totalRecords.set(0);
            return [];
          }

          this.totalRecords.set(result.total);

          return result.items.map(i => ({
            ...i,
            ...i.spectraExtension
          }))
        }
      ),
      tap(() => {
        this.isLoading.set(false);
      }),
    );
  }

  protected initTableConfigStream(): Observable<TableConfig<ClientDisplay>> {
    return combineLatest({
      settings: this.settings$,
      translator: this.valuesTranslator$
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

  protected changePageOptions(options: Partial<{ page: number, pageSize: number }>): void {
    this.page$.pipe(
      take(1)
    ).subscribe(page => {
      this.page$.next({
        page: options.page ?? page.page,
        pageSize: options.pageSize ?? page.pageSize
      });
    });
  }
}
