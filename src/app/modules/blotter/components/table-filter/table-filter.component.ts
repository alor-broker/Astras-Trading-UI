import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";

@Component({
  selector: 'ats-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.less']
})
export class TableFilterComponent implements OnChanges, OnInit {

  filtersForm = new UntypedFormGroup({});

  @Input({required: true})
  columns: BaseColumnSettings<any>[] = [];
  @Output()
  filterChange = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.filtersForm.valueChanges.subscribe(val => this.filterChange.emit(val));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.columns) {
      this.filtersForm = new UntypedFormGroup(
        this.columns
          .filter(col => !!col.filterData)
          .reduce((acc, curr) => {
          acc[curr.id] = new UntypedFormControl('');
          return acc;
        }, {} as any)
      );
    }
  }

  reset() {
    const activeCol = this.columns.find(col => col.filterData?.isOpenedFilter);

    this.filtersForm.get(activeCol!.id)?.reset();
  }
}
