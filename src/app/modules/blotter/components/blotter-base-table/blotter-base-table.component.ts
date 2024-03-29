import {
  Component,
  DestroyRef, Input,
  OnInit,
} from '@angular/core';
import { take, combineLatest, Observable, shareReplay, BehaviorSubject } from "rxjs";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ExportHelper } from "../../utils/export-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { ContentSize } from "../../../../shared/models/dashboard/dashboard-item.model";
import { map } from "rxjs/operators";

@Component({
  template: ''
})
export abstract class BlotterBaseTableComponent<T extends { id: string }, F extends object>
extends BaseTableComponent<T, F>
implements OnInit {
  @Input({ required: true }) guid!: string;

  settings$!: Observable<BlotterSettings>;
  protected isFilterDisabled = (): boolean => Object.keys(this.filters$.getValue()).length === 0;
  protected columns!: BaseColumnSettings<T>[];
  protected footerSize$ = new BehaviorSubject<ContentSize | null>(null);

  protected fileSuffix!: string;

  protected constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnInit(): void {
    this.settings$ = this.settingsService.getSettings<BlotterSettings>(this.guid)
      .pipe(
        shareReplay(1),
        takeUntilDestroyed(this.destroyRef)
      );

    super.ngOnInit();

    this.tableConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => this.columns = c?.columns ?? []);
  }

  protected reset(): void {
    this.filters$.next(<F>{});
  }

  changeColumnOrder(event: CdkDragDrop<any>): void {
    super.changeColumnOrder<BlotterSettings>(event, this.settings$);
  }

  saveColumnWidth(event: { columnId: string, width: number }): void {
    super.saveColumnWidth<BlotterSettings>(event, this.settings$);
  }

  protected initContentSize(): void {
    this.contentSize$ = combineLatest([
      this.containerSize$,
      this.headerSize$,
      this.footerSize$
    ])
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map(([containerSize, headerSize, footerSize]) => ({
          width: containerSize?.width ?? headerSize?.width ?? footerSize?.width ?? 0,
          height: (containerSize?.height ?? 0) - ((headerSize?.height ?? 0) + (footerSize?.height ?? 0))
        }))
      );
  }

  footerSizeChanged(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.footerSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  protected filterChange(newFilter: F): void {
    this.filters$.next({
      ...this.filters$.getValue(),
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

  protected isFilterApplied(column: BaseColumnSettings<T>): boolean {
    const filter = this.filters$.getValue() as { [filterName: string]: string | string[] | null | undefined };
    return column.id in filter
      && filter[column.id] != null
      && filter[column.id]!.length > 0;
  }

  canExport(data: readonly T[] | undefined | null): boolean {
    return !!data && data.length > 0;
  }

  protected exportToFile(data?: readonly T[]): void {
    combineLatest({
      tBlotterCommon: this.translatorService.getTranslator('blotter/blotter-common'),
      tBlotter: this.translatorService.getTranslator('blotter'),
      settings: this.settings$,
      tableConfig: this.tableConfig$
    })
      .pipe(
        take(1),
      )
      .subscribe(({tBlotter, tBlotterCommon, settings, tableConfig}) => {
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
          tableConfig.columns,
          valueTranslators
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
        const column = this.columns.find(o => o.id == key);
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
