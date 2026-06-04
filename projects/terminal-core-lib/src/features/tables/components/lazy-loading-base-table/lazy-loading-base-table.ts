import {
  Component,
  signal
} from '@angular/core';
import {
  BaseTableComponent,
  Sort
} from '../base-table';
import {toObservable} from '@angular/core/rxjs-interop';

@Component({
  template: ''
})
export abstract class LazyLoadingBaseTable<
  T extends object,
  F extends object = object,
  P = { limit: number, offset: number },
  S = Sort,
> extends BaseTableComponent<T, F, S> {
  readonly isLoading = signal(false);

  protected readonly loadingChunkSize = 50;

  protected readonly scrolled = signal(new Date().getTime());

  protected readonly scrolledChanges$ = toObservable(this.scrolled);

  protected pagination: P | null = null;

  override applyFilter(filters: F): void {
    this.pagination = null;
    super.applyFilter(filters);
  }
}
