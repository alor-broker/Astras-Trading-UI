import {Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChange, SimpleChanges} from '@angular/core';
import {BaseColumnSettings, FilterType} from "../../../../shared/models/settings/table-settings.model";
import {Subscription} from "rxjs";
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, UntypedFormGroup} from "@angular/forms";
import {debounceTime} from "rxjs/operators";
import {NgForOf, NgIf} from "@angular/common";
import {TranslocoDirective} from "@jsverse/transloco";
import {NzInputDirective} from "ng-zorro-antd/input";
import {NzButtonComponent} from "ng-zorro-antd/button";

@Component({
    selector: 'ats-search-filter',
    templateUrl: './search-filter.component.html',
    styleUrls: ['./search-filter.component.less'],
    imports: [
        ReactiveFormsModule,
        NgIf,
        TranslocoDirective,
        NgForOf,
        NzInputDirective,
        NzButtonComponent
    ]
})
export class SearchFilterComponent implements OnChanges, OnDestroy {
  filtersForm?: UntypedFormGroup;

  @Input({required: true})
  columns: BaseColumnSettings<any>[] = [];

  @Output()
  filterChange = new EventEmitter<Record<string, string>>();

  private changesSubscription?: Subscription;

  constructor(private readonly formBuilder: FormBuilder) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.columns as SimpleChange | undefined)) {
      this.changesSubscription?.unsubscribe();

      const controls = this.columns
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
    const activeCol = this.columns.find(col => col.filterData?.isOpenedFilter);
    this.filtersForm?.get(activeCol!.id)?.reset();
  }

  ngOnDestroy(): void {
    this.changesSubscription?.unsubscribe();
  }
}
