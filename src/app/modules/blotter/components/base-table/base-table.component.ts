import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { filter, map, startWith } from "rxjs/operators";
import { BehaviorSubject, Observable, shareReplay, switchMap, take, combineLatest } from "rxjs";
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
import { TranslatorService } from "../../../../shared/services/translator.service";

@Component({
  template: ''
})
export abstract class BaseTableComponent<T extends { id: string }, F extends object> implements OnInit, AfterViewInit, OnDestroy {
  @Input({required: true})
  guid!: string;

  protected readonly columnDefaultWidth = 100;
  protected readonly scrollHeight$ = new BehaviorSubject<number>(100);
  protected readonly filter$ = new BehaviorSubject<F>(<F>{});

  protected settings$!: Observable<BlotterSettings>;
  protected settingsTableName!: TableNames;
  protected settingsColumnsName!: ColumnsNames;

  protected listOfColumns: BaseColumnSettings<T>[] = [];

  @ViewChildren('nzTable')
  dataTableQuery!: QueryList<NzTableComponent<T>>;

  @ViewChildren('tableContainer')
  tableContainer!: QueryList<ElementRef<HTMLElement>>;

  protected tableRef$!: Observable<NzTableComponent<T>>;
  protected tableInnerWidth = 1000;
  protected isFilterDisabled = (): boolean => Object.keys(this.filter$.getValue()).length === 0;

  protected fileSuffix!: string;
  protected badgeColor = defaultBadgeColor;

  protected constructor(
    protected readonly service: BlotterService,
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid)
      .pipe(
        shareReplay(1)
      );
  }

  ngAfterViewInit(): void {
    const container$ =  this.tableContainer.changes.pipe(
      map(x => x.first as ElementRef<HTMLElement> | undefined),
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

    this.tableRef$ = this.dataTableQuery.changes.pipe(
      map(x => x.first as ElementRef<NzTableComponent<T>> | undefined),
      startWith(this.dataTableQuery.first),
      filter((x): x is NzTableComponent<T> => !!x),
      shareReplay(1)
    );
  }

  ngOnDestroy(): void {
    this.scrollHeight$.complete();
    this.filter$.complete();
  }

  protected reset(): void {
    this.filter$.next(<F>{});
  }

  protected filterChange(newFilter: F): void {
    this.filter$.next({
      ...this.filter$.getValue(),
      ...newFilter
    });
  }

  protected defaultFilterChange(key: string, value: string[]): void {
    this.filterChange(<F>{ [key]: value });
  }

  formatDate(date: Date): string {
    if (date.toDateString() == new Date().toDateString()) {
      return date.toLocaleTimeString();
    }
    else return date.toLocaleDateString();
  }

  protected selectInstrument(symbol: string, exchange: string): void {
    this.service.selectNewInstrument(symbol, exchange, this.badgeColor);
  }

  protected isFilterApplied(column: BaseColumnSettings<T>): boolean {
    const filter = this.filter$.getValue();
    return column.id in filter && filter[column.id as keyof F] != null && !!(filter[column.id as keyof F] as string).length;
  }

  canExport(data: readonly T[] | undefined | null): boolean {
    return !!data && data.length > 0;
  }

  protected exportToFile(data?: readonly T[]): void {
    combineLatest({
      tBlotterCommon: this.translatorService.getTranslator('blotter/blotter-common'),
      tBlotter: this.translatorService.getTranslator('blotter'),
      settings: this.settings$
    })
      .pipe(
        take(1),
      )
      .subscribe(({tBlotter, tBlotterCommon, settings}) => {
        const valueTranslators = new Map<string, (value: any) => string>([
          ['status', (value): string => tBlotterCommon(['orderStatus', value])],
          ['transTime', (value): string => this.formatDate(value)],
          ['endTime', (value): string => this.formatDate(value)],
          ['date', (value): string => this.formatDate(value)]
        ]);

        ExportHelper.exportToCsv(
          tBlotter([this.fileSuffix + 'Tab']),
          settings,
          [...(data ?? [])],
          this.listOfColumns,
          valueTranslators
        );
      });
  }

  protected saveColumnWidth(id: string, width: number): void {
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

  protected recalculateTableWidth(widthChange: { columnWidth: number, delta: number | null }): void {
    const delta = widthChange.delta ?? widthChange.columnWidth - this.columnDefaultWidth;
    this.tableInnerWidth += delta;
  }

  protected changeColumnOrder(event: CdkDragDrop<any>): void {
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
      if ((filter[key as keyof F] as string | undefined) != null && !!(filter[key as keyof F] as string).length) {
        const column = this.listOfColumns.find(o => o.id == key);
        if (
          !(column!.filterData!.isDefaultFilter ?? false) && !this.searchInItem(item, <keyof T>key, <string>filter[<keyof F>key]) ||
          (column!.filterData!.isDefaultFilter ?? false) && ((<string | undefined>filter[<keyof F>key])?.length ?? 0) && !(<string>filter[<keyof F>key])!.includes(item[<keyof T>key]!.toString())
        ) {
          isFiltered = false;
        }
      }
    }
    return isFiltered;
  }

  protected searchInItem(item: T, key: keyof T, value?: string): boolean {
    if (value == null || !value.length) {
      return true;
    }
    return item[key]!.toString().toLowerCase().includes((value as string).toLowerCase());
  }
}
