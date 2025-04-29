import { Component, DestroyRef, OnDestroy } from '@angular/core';
import { BaseTableComponent, Sort } from "../base-table/base-table.component";
import { WidgetSettingsService } from "../../services/widget-settings.service";
import { BehaviorSubject } from "rxjs";

@Component({
    template: '',
    standalone: false
})
export abstract class LazyLoadingBaseTableComponent<
  T extends Record<string, any>,
  F extends Record<string, any> = object,
  P = { limit: number, offset: number },
  S = Sort,
> extends BaseTableComponent<T, F, S>
  implements OnDestroy
{
  protected readonly loadingChunkSize = 50;

  readonly isLoading$ = new BehaviorSubject<boolean>(false);
  protected readonly scrolled$ = new BehaviorSubject<null>(null);
  protected pagination: P | null = null;

  constructor(
    protected readonly settingsService: WidgetSettingsService,
    protected readonly destroyRef: DestroyRef
  ) {
    super(settingsService, destroyRef);
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
    this.isLoading$.complete();
    this.scrolled$.complete();
  }

  applyFilter(filters: F): void {
    this.pagination = null;
    super.applyFilter(filters);
  }
}
