import {Component, input, OnChanges, OnDestroy, output, SimpleChange, SimpleChanges} from '@angular/core';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup} from "@angular/forms";
import {BaseColumnSettings, FilterType} from "../../models/settings/table-settings.model";
import {Subscription} from "rxjs";
import {debounceTime} from "rxjs/operators";

import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzInputDirective} from "ng-zorro-antd/input";
import {TranslocoDirective} from "@jsverse/transloco";

@Component({
  selector: 'ats-table-search-filter',
  imports: [
    NzButtonComponent,
    NzInputDirective,
    TranslocoDirective,
    ReactiveFormsModule
  ],
  templateUrl: './table-search-filter.component.html',
  styleUrl: './table-search-filter.component.less'
})
export class TableSearchFilterComponent implements OnChanges, OnDestroy {
  filtersForm?: UntypedFormGroup;

  columns = input.required<BaseColumnSettings<any>[]>();

  filterChange = output<Record<string, string>>();

  private changesSubscription?: Subscription;

  constructor(private readonly formBuilder: FormBuilder) {
  }

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
