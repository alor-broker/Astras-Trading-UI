import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef, Input,
  OnDestroy, OnInit,
  QueryList,
} from '@angular/core';
import { filter, map, startWith } from "rxjs/operators";
import { BehaviorSubject, Observable, shareReplay, switchMap, take } from "rxjs";
import { TableAutoHeightBehavior } from "../../utils/table-auto-height.behavior";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { TableSettingHelper } from "../../../../shared/utils/table-setting.helper";
import { BlotterSettings, ColumnsNames, TableNames } from "../../models/blotter-settings.model";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { BlotterTablesHelper } from "../../utils/blotter-tables.helper";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ExportHelper } from "../../utils/export-helper";
import { NzTableComponent } from "ng-zorro-antd/table";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { BlotterService } from "../../services/blotter.service";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";

@Component({
  template: ''
})
export abstract class BaseTableComponent<T extends { id: string }, F extends {}> implements OnInit, AfterViewInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  protected readonly columnDefaultWidth = 100;
  protected readonly scrollHeight$ = new BehaviorSubject<number>(100);
  protected readonly filter$ = new BehaviorSubject<F>(<F>{});

  protected settings$!: Observable<BlotterSettings>;
  protected settingsTableName!: TableNames;
  protected settingsColumnsName!: ColumnsNames;

  protected listOfColumns: BaseColumnSettings<T>[] = [];

  protected table?: NzTableComponent<T>;
  protected tableContainer!: QueryList<ElementRef<HTMLElement>>;
  protected tableInnerWidth: number = 1000;
  protected isFilterDisabled = () => Object.keys(this.filter$.getValue()).length === 0;

  protected fileSuffix!: string;
  protected badgeColor = defaultBadgeColor;

  protected constructor(
    protected readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit() {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid);
  }

  ngAfterViewInit(): void {
    const container$ =  this.tableContainer.changes.pipe(
      map(x => x.first),
      startWith(this.tableContainer.first),
      filter((x): x is ElementRef<HTMLElement> => !!x),
      shareReplay(1)
    );

    container$.pipe(
      switchMap(x => TableAutoHeightBehavior.getScrollHeight(x)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      setTimeout(()=> this.scrollHeight$.next(x));
    });
  }

  ngOnDestroy(): void {
    this.scrollHeight$.complete();
  }

  protected reset(): void {
    this.filter$.next(<F>{});
  }

  protected filterChange(newFilter: F) {
    this.filter$.next({
      ...this.filter$.getValue(),
      ...newFilter
    });
  }

  protected defaultFilterChange(key: string, value: string[]) {
    this.filterChange(<F>{ [key]: value });
  }

  protected translateStatus(status: string) {
    switch (status) {
      case 'filled':
        return 'Исполн';
      case 'canceled':
        return 'Отменен';
      case 'working':
        return 'Активен';
      default:
        return status;
    }
  }

  protected formatDate(date: Date) {
    return new Date(date).toLocaleTimeString();
  }

  protected selectInstrument(symbol: string, exchange: string) {
    this.service.selectNewInstrument(symbol, exchange, this.badgeColor);
  }

  protected isFilterApplied(column: BaseColumnSettings<T>) {
    const filter = this.filter$.getValue();
    return column.id in filter && !!filter[<keyof F>column.id];
  }

  protected get canExport(): boolean {
    return !!this.table?.data && this.table.data.length > 0;
  }

  protected exportToFile() {
    const valueTranslators = new Map<string, (value: any) => string>([
      ['status', value => this.translateStatus(value)],
      ['transTime', value => this.formatDate(value)],
      ['endTime', value => this.formatDate(value)],
      ['date', value => this.formatDate(value)]
    ]);

    this.settings$.pipe(take(1)).subscribe(settings => {
      ExportHelper.exportToCsv(
        this.fileSuffix,
        settings,
        [...this.table?.data ?? []],
        this.listOfColumns,
        valueTranslators
      );
    });
  }

  protected saveColumnWidth(id: string, width: number) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      const tableSettings = settings[this.settingsTableName] ?? TableSettingHelper.toTableDisplaySettings(settings[this.settingsColumnsName]);
      if (tableSettings) {
        this.settingsService.updateSettings<BlotterSettings>(
          settings.guid,
          {
            [this.settingsTableName]: TableSettingHelper.updateColumn(
              id,
              tableSettings,
              {
                columnWidth: width
              }
            )
          }
        );
      }
    });
  }

  protected recalculateTableWidth(widthChange: { columnWidth: number, delta: number | null }) {
    const delta = widthChange.delta ?? widthChange.columnWidth - this.columnDefaultWidth;
    this.tableInnerWidth += delta;
  }

  protected changeColumnOrder(event: CdkDragDrop<any>) {
    this.settings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsService.updateSettings<BlotterSettings>(
        settings.guid,
        {
          [this.settingsTableName]: BlotterTablesHelper.changeColumnOrder(
            event,
            settings[this.settingsTableName] ?? TableSettingHelper.toTableDisplaySettings(settings[this.settingsColumnsName])!,
            this.listOfColumns
          )
        }
      );
    });
  }

  protected trackBy(index: number, item: T): string {
    return item.id;
  }

  protected justifyFilter(item: T, filter: F): boolean {
    let isFiltered = true;
    for (const key of Object.keys(filter)) {
      if (filter[<keyof F>key]) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !column!.filterData!.isDefaultFilter && !this.searchInItem(item, <keyof T>key, <string>filter[<keyof F>key]) ||
          column!.filterData!.isDefaultFilter && (<string>filter[<keyof F>key])?.length  && !(<string>filter[<keyof F>key])?.includes(item[<keyof T>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  protected searchInItem(item: T, key: keyof T, value?: string): boolean {
    if (!value) {
      return true;
    }
    return item[key]!.toString().toLowerCase().includes(value.toLowerCase());
  }


}
