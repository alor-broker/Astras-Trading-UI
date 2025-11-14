import { Component, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  take,
  withLatestFrom
} from "rxjs";
import { ContentSize } from "../../models/dashboard/dashboard-item.model";
import {
  BaseColumnSettings,
  TableDisplaySettings
} from "../../models/settings/table-settings.model";
import { TableConfig } from "../../models/table-config.model";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { TableSettingHelper } from "../../utils/table-setting.helper";
import { map } from "rxjs/operators";
import { WidgetSettings } from "../../models/widget-settings.model";

export interface Sort {
  descending: boolean;
  orderBy: string;
}

@Component({
    template: '',
    standalone: false
})
export abstract class BaseTableComponent<
    T extends Record<string, any>,
    F extends Record<string, any> = object,
    S = Sort
  >
implements OnInit, OnDestroy {
  protected readonly defaultColumnWidth = 100;

  protected contentSize$!: Observable<ContentSize | null>;
  protected containerSize$ = new BehaviorSubject<ContentSize | null>(null);
  protected headerSize$ = new BehaviorSubject<ContentSize | null>(null);
  protected readonly filters$ = new BehaviorSubject<F>({} as F);
  protected readonly sort$ = new BehaviorSubject<S | null>(null);
  protected readonly abstract allColumns: BaseColumnSettings<T>[];
  tableConfig$!: Observable<TableConfig<T>>;
  tableData$!: Observable<T[]>;

  protected settingsTableName?: string;
  protected settingsColumnsName?: string;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.tableConfig$ = this.initTableConfigStream();
    this.tableData$ = this.initTableDataStream();
    this.initContentSize();
  }

  ngOnDestroy(): void {
    this.containerSize$.complete();
    this.headerSize$.complete();
    this.filters$.complete();
    this.sort$.complete();
  }

  protected abstract initTableDataStream(): Observable<T[]>;

  protected abstract initTableConfigStream(): Observable<TableConfig<T>>;

  protected initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.headerSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, headerSize]) => ({
            width: containerSize?.width ?? headerSize?.width ?? 5,
            height: Math.max((containerSize?.height ?? 0) - (headerSize?.height ?? 0), 5)
          })
        )
      );
  }

  rowClick?(row: T, event?: Event): void;

  applyFilter(filters: F): void {
    const cleanedFilters = Object.keys(filters)
      .filter(key =>
        filters[key] != null &&
        (
          (typeof filters[key] === 'number') ||
          (typeof filters[key] === 'boolean') ||
          (filters[key] as string | string[]).length > 0
        )
      )
      .reduce((acc, curr: keyof F) => {
        if (Array.isArray(filters[curr])) {
          acc[curr] = filters[curr].join(';') as F[keyof F];
        } else {
          acc[curr] = filters[curr]!;
        }
        return acc;
      }, {} as F);

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

  changeColumnOrder<T extends WidgetSettings>(event: CdkDragDrop<any>, settings$?: Observable<T>): void {
    settings$?.pipe(
      withLatestFrom(this.tableConfig$),
      take(1)
    ).subscribe(([settings, tableConfig]) => {
      this.settingsService.updateSettings<T>(
        settings.guid,
        {
          [this.settingsTableName! as keyof T]: TableSettingHelper.changeColumnOrder(
            event,
            TableSettingHelper.toTableDisplaySettings(
              settings[this.settingsTableName! as keyof T] as TableDisplaySettings | undefined,
              this.settingsColumnsName != null
                ? (settings[this.settingsColumnsName as keyof T] as string[] | undefined) ?? []
                : undefined
            )!,
            tableConfig.columns
          )
        } as Partial<T>
      );
    });
  }

  saveColumnWidth<T extends WidgetSettings>(event: { columnId: string, width: number }, settings$?: Observable<T>): void {
    settings$?.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = TableSettingHelper.toTableDisplaySettings(
        settings[this.settingsTableName! as keyof T] as TableDisplaySettings | undefined,
        settings[this.settingsColumnsName! as keyof T] as string[] | undefined ?? []
      );

      if (tableSettings) {
        this.settingsService.updateSettings<T>(
          settings.guid,
          {
            [this.settingsTableName!]: TableSettingHelper.updateColumn(
              event.columnId,
              tableSettings,
              {
                columnWidth: event.width
              }
            )
          } as Partial<T>
        );
      }
    });
  }
}
