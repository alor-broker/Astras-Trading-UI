import { Component, DestroyRef, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, shareReplay, take, withLatestFrom } from "rxjs";
import { ContentSize } from "../../models/dashboard/dashboard-item.model";
import { BaseColumnSettings } from "../../models/settings/table-settings.model";
import { TableConfig } from "../../models/table-config.model";
import { WidgetSettings } from "../../models/widget-settings.model";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { defaultBadgeColor } from "../../utils/instruments";
import { ACTIONS_CONTEXT, ActionsContext } from "../../services/actions-context";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { TableSettingHelper } from "../../utils/table-setting.helper";
import { map } from "rxjs/operators";


@Component({
  template: ''
})
export abstract class BaseTableComponent<
    SETTINGS extends WidgetSettings,
    DATA extends { [propName: string]: any },
    FILTERS extends { [propName: string]: any } = object,
    PAGINATION = { limit: number, offset: number },
    SORT = { descending: boolean, orderBy: string }
  >
implements OnInit, OnDestroy {
  @Input() guid?: string;

  protected readonly loadingChunkSize = 50;
  protected readonly defaultColumnWidth = 100;

  protected contentSize$!: Observable<ContentSize | null>;
  readonly containerSize$ = new BehaviorSubject<ContentSize | null>(null);
  readonly headerSize$ = new BehaviorSubject<ContentSize | null>(null);
  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  protected readonly filters$ = new BehaviorSubject<FILTERS>({} as FILTERS);
  protected readonly sort$ = new BehaviorSubject<SORT | null>(null);
  protected readonly scrolled$ = new BehaviorSubject<null>(null);
  protected pagination: PAGINATION | null = null;
  protected allColumns!: BaseColumnSettings<DATA>[];
  tableConfig$!: Observable<TableConfig<DATA>>;
  tableData$!: Observable<DATA[]>;
  protected settings$!: Observable<SETTINGS>;

  protected settingsTableName!: keyof SETTINGS;
  protected settingsColumnsName!: keyof SETTINGS;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef,
    @Inject(ACTIONS_CONTEXT) protected readonly actionsContext?: ActionsContext,
  ) {
  }

  ngOnInit(): void {
    if (this.guid != null) {
      this.settings$ = this.settingsService.getSettings<SETTINGS>(this.guid)
        .pipe(
          shareReplay(1),
          takeUntilDestroyed(this.destroyRef)
        );
    }

    this.initTableConfig();
    this.initTableData();
    this.initContentSize();
  }

  ngOnDestroy(): void {
    this.containerSize$.complete();
    this.headerSize$.complete();
    this.isLoading$.complete();
    this.filters$.complete();
    this.sort$.complete();
    this.scrolled$.complete();
  }

  protected abstract  initTableData(): void;

  protected abstract initTableConfig(): void;

  protected initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.headerSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, headerSize]) => ({
          width: containerSize?.width ?? headerSize?.width ?? 0,
          height: (containerSize?.height ?? 0) - (headerSize?.height ?? 0)
        }))
      );
  }

  rowClick(row: DATA, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();

    const instrument = this.rowToInstrumentKey(row);

    this.settings$.pipe(
      take(1)
    ).subscribe(s => {
      this.actionsContext?.instrumentSelected(instrument, s.badgeColor ?? defaultBadgeColor);
    });
  }

  rowToInstrumentKey(row: DATA): InstrumentKey {
    return {
      symbol: row.symbol as string,
      exchange: row.exchange as string,
      instrumentGroup: row.instrumentGroup as string
    };
  }

  applyFilter(filters: FILTERS): void {
    const cleanedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, curr: keyof FILTERS) => {
        if (Array.isArray(filters[curr])) {
          acc[curr] = filters[curr].join(';') as FILTERS[keyof FILTERS];
        } else {
          acc[curr] = filters[curr]!;
        }
        return acc;
      }, {} as FILTERS);

    this.pagination = null;
    this.filters$.next(cleanedFilters);
  }

  containerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.containerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  headerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.headerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    this.settings$.pipe(
      withLatestFrom(this.tableConfig$),
      take(1)
    ).subscribe(([settings, tableConfig]) => {
      this.settingsService.updateSettings<SETTINGS>(
        settings.guid,
        {
          [this.settingsTableName]: TableSettingHelper.changeColumnOrder(
            event,
            TableSettingHelper.toTableDisplaySettings(settings[this.settingsTableName], settings[this.settingsColumnsName] ?? [])!,
            tableConfig.columns
          )
        } as Partial<SETTINGS>
      );
    });
  }

  saveColumnWidth(event: {columnId: string, width: number}): void {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = TableSettingHelper.toTableDisplaySettings(settings[this.settingsTableName], settings[this.settingsColumnsName]);
      if (tableSettings) {
        this.settingsService.updateSettings<SETTINGS>(
          settings.guid,
          {
            [this.settingsTableName]: TableSettingHelper.updateColumn(
              event.columnId,
              tableSettings,
              {
                columnWidth: event.width
              }
            )
          } as Partial<SETTINGS>
        );
      }
    });
  }
}
