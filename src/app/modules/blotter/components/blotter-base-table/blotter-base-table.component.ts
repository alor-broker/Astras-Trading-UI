import {
  Component,
  DestroyRef, Inject,
  OnInit,
} from '@angular/core';
import { take, combineLatest } from "rxjs";
import { BlotterSettings } from "../../models/blotter-settings.model";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import { ExportHelper } from "../../utils/export-helper";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { TranslatorService } from "../../../../shared/services/translator.service";
import { BaseTableComponent } from "../../../../shared/components/base-table/base-table.component";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ACTIONS_CONTEXT, ActionsContext } from "../../../../shared/services/actions-context";

@Component({
  template: ''
})
export abstract class BlotterBaseTableComponent<T extends { id: string }, F extends object>
extends BaseTableComponent<BlotterSettings, T, F>
implements OnInit {
  protected isFilterDisabled = (): boolean => Object.keys(this.filters$.getValue()).length === 0;
  protected columns!: BaseColumnSettings<T>[];

  protected fileSuffix!: string;

  protected constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly translatorService: TranslatorService,
    protected readonly destroyRef: DestroyRef,
    @Inject(ACTIONS_CONTEXT) protected readonly actionsContext?: ActionsContext
  ) {
    super(settingsService, destroyRef, actionsContext);
  }

  ngOnInit(): void {
    super.ngOnInit();

    this.tableConfig$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => this.columns = c?.columns ?? []);
  }

  protected reset(): void {
    this.filters$.next(<F>{});
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
