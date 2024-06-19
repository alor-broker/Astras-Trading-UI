import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChange,
  SimpleChanges
} from '@angular/core';
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import {Subscription} from "rxjs";
import {
  FormControl,
  FormGroup
} from "@angular/forms";

@Component({
  selector: 'ats-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.less']
})
export class TableFilterComponent implements OnChanges, OnDestroy {
  filtersForm?: FormGroup;
  private changesSubscription?: Subscription;

  @Input({required: true})
  columns: BaseColumnSettings<any>[] = [];
  @Output()
  filterChange = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.columns as SimpleChange | undefined)) {
      this.changesSubscription?.unsubscribe();

      this.filtersForm = new FormGroup(
        this.columns
          .filter(col => !!col.filterData)
          .reduce((acc, curr) => {
          acc[curr.id] = new FormControl('');
          return acc;
        }, {} as { [controlName: string]: FormControl })
      );

      this.changesSubscription = this.filtersForm.valueChanges
        .subscribe(val => this.filterChange.emit(val));
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
