import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
  input,
  OnChanges,
  OnDestroy,
  output,
  SimpleChange,
  SimpleChanges,
  ViewEncapsulation
} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  UntypedFormGroup
} from '@angular/forms';
import {NzInputDirective} from 'ng-zorro-antd/input';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {
  BaseColumnSettings,
  FilterType
} from '../../types/table-display-settings.types';
import {
  debounceTime,
  Subscription
} from 'rxjs';

@Component({
  selector: 'ats-table-search-filter',
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    NzInputDirective,
    NzButtonComponent
  ],
  templateUrl: './table-search-filter.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableSearchFilter implements OnChanges, OnDestroy {
  filtersForm?: UntypedFormGroup;

  readonly columns = input.required<BaseColumnSettings<any>[]>();

  filterChange = output<Record<string, string>>();

  private readonly formBuilder = inject(FormBuilder);

  private changesSubscription?: Subscription;

  private readonly cdr = inject(ChangeDetectorRef);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.columns as SimpleChange | undefined)) {
      this.changesSubscription?.unsubscribe();

      const controls = this.columns()
        .filter(col => !!col.filterData && col.filterData.filterType === FilterType.Search)
        .reduce((acc, curr) => {
            const control = this.formBuilder.nonNullable.control('');
            control.setValue(curr.filterData?.initialValue as string ?? '');
            acc[curr.id] = control;
            return acc;
          },
          {} as Record<string, FormControl<string>>
        );

      this.filtersForm = new FormGroup(controls);

      this.changesSubscription = this.filtersForm.valueChanges.pipe(
        debounceTime(250),
      ).subscribe(val => {
        this.filterChange.emit(val);
      });

      this.cdr.markForCheck();
    }
  }

  reset(): void {
    const activeCol = this.columns().find(col => col.filterData?.isOpenedFilter ?? false);
    this.filtersForm?.get(activeCol!.id)?.reset();
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }
}

