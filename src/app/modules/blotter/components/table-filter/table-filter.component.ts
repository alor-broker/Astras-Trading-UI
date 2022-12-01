import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Column } from "../../models/column.model";
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";

@Component({
  selector: 'ats-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.less']
})
export class TableFilterComponent implements OnChanges, OnInit {

  filtersForm = new UntypedFormGroup({});

  @Input() columns: Column<any, any>[] = [];
  @Output() filterChange = new EventEmitter();

  constructor() {}

  ngOnInit() {
    this.filtersForm.valueChanges.subscribe(val => this.filterChange.emit(val));
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.columns) {
      this.filtersForm = new UntypedFormGroup(
        this.columns.reduce((acc, curr) => {
          acc[curr.id] = new UntypedFormControl('');
          return acc;
        }, {} as any)
      );
    }
  }

  reset() {
    const activeCol = this.columns.find(col => col.isSearchVisible);

    this.filtersForm.get(activeCol!.id)?.reset();
  }
}
