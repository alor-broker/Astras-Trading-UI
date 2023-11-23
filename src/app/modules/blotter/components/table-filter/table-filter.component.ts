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
import { UntypedFormControl, UntypedFormGroup } from "@angular/forms";
import { BaseColumnSettings } from "../../../../shared/models/settings/table-settings.model";
import {Subscription} from "rxjs";

@Component({
  selector: 'ats-table-filter',
  templateUrl: './table-filter.component.html',
  styleUrls: ['./table-filter.component.less']
})
export class TableFilterComponent implements OnChanges, OnDestroy {

  filtersForm?: UntypedFormGroup;
  private changesSubscription?: Subscription;

  @Input({required: true})
  columns: BaseColumnSettings<any>[] = [];
  @Output()
  filterChange = new EventEmitter();

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes.columns as SimpleChange | undefined)) {
      this.changesSubscription?.unsubscribe();

      this.filtersForm = new UntypedFormGroup(
        this.columns
          .filter(col => !!col.filterData)
          .reduce((acc, curr) => {
          acc[curr.id] = new UntypedFormControl('');
          return acc;
        }, {} as { [controlName: string]: UntypedFormControl })
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
