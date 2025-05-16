import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteScrollTableComponent } from './infinite-scroll-table.component';
import { NzTableModule } from "ng-zorro-antd/table";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { TableConfig } from '../../models/table-config.model';
import { BaseColumnSettings, FilterType } from "../../models/settings/table-settings.model";
import { ResizeColumnDirective } from "../../directives/resize-column.directive";
import { FormControl } from "@angular/forms";
import { TranslocoTestsModule } from "../../utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../utils/testing/common-test-providers";
import { NzToolTipModule } from "ng-zorro-antd/tooltip";

@Component({
    template: `
    <ats-infinite-scroll-table
      [tableContainerHeight]="tableContainerHeight"
      [tableContainerWidth]="tableContainerWidth"
      [data]="testData"
      [isLoading]="isLoading"
      [tableConfig]="tableConfig"
      [trackByFn]="trackByFn"
      (scrolled)="scrolled()"
      (filterApplied)="applyFilter($event)"
      (rowClick)="rowClick($event)"
    >
    </ats-infinite-scroll-table>
  `,
    standalone: false
})
class TestWrapperComponent implements OnInit {
  constructor(private readonly cdr: ChangeDetectorRef) {
  }

  tableContainerHeight = 50;
  tableContainerWidth = 50;
  isLoading = true;

  tableConfig: TableConfig<any> = {
    columns: [
      {
        id: 'id1',
        displayName: 'name1',
        filterData: {
          filterName: 'name1',
          filterType: FilterType.Search
        },
        width: 50
      },
      { id: 'id2', displayName: 'name2' },
    ]
  };

  testData: any[] = [
    {id1: 'testName1', id2: 'testName2', id: 1},
    {id1: 'testName1', id2: 'testName2', id: 2},
    {id1: 'testName1', id2: 'testName2', id: 3},
    {id1: 'testName1', id2: 'testName2', id: 4},
  ];

  trackByFn = (e: any): string => e.name as string;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  applyFilter(e: any): void { return; }
  scrolled(): void { return; }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rowClick(e: any): void { return; }

  ngOnInit(): void {
    this.cdr.detectChanges();
  }
}

describe('InfiniteScrollTableComponent', () => {
  let component: InfiniteScrollTableComponent;
  let wrapperComp: TestWrapperComponent;
  let wrapperFixture: ComponentFixture<TestWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InfiniteScrollTableComponent,
        TestWrapperComponent,
        ResizeColumnDirective
      ],
      imports: [
        NoopAnimationsModule,
        NzTableModule,
        NzDropDownModule,
        TranslocoTestsModule.getModule(),
        NzToolTipModule
      ],
      providers: [...commonTestProviders]
    })
    .compileComponents();
  });

  beforeEach(() => {
    wrapperFixture = TestBed.createComponent(TestWrapperComponent);
    wrapperComp = wrapperFixture.componentInstance;
    component = wrapperFixture.debugElement.query(By.css('ats-infinite-scroll-table')).componentInstance;
    wrapperFixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add controls to filters form', () => {
    expect(component.filtersForm.get('name1')).toBeTruthy();
    expect(component.filtersForm.get('name2')).toBeFalsy();
  });

  it('should provide inputs', () => {
    expect(component.trackByFn).toBe(wrapperComp.trackByFn);
    expect(component.tableContainerHeight).toBe(wrapperComp.tableContainerHeight);
    expect(component.tableContainerWidth).toBe(wrapperComp.tableContainerWidth);
    expect(component.data).toBe(wrapperComp.testData);
    expect(component.isLoading).toBe(wrapperComp.isLoading);
    expect(component.tableConfig).toEqual(wrapperComp.tableConfig);
  });

  it('should call functions when outputs emitted', () => {
    const testData = {testData: 'testData'};
    const rowClickSpy = spyOn(wrapperComp, 'rowClick').and.callThrough();
    const scrolledSpy = spyOn(wrapperComp, 'scrolled').and.callThrough();
    const filterAppliedSpy = spyOn(wrapperComp, 'applyFilter').and.callThrough();

    component.rowClick.emit(testData);
    component.scrolled.emit();
    component.filterApplied.emit(testData);

    expect(rowClickSpy).toHaveBeenCalledOnceWith(testData);
    expect(scrolledSpy).toHaveBeenCalledOnceWith();
    expect(filterAppliedSpy).toHaveBeenCalledOnceWith(testData);
  });

  it('should return columns widhts', () => {
    expect(component.getWidthArr()).toEqual(wrapperComp.tableConfig.columns.map((col: BaseColumnSettings<any>) => (col.width ?? 0) ? `${col.width}px` : 'auto'));
  });

  it('should return filter control', () => {
    expect(component.getFilterControl('name1')).toEqual(component.filtersForm.get('name1') as unknown as FormControl);
    expect(component.getFilterControl('notExistingName')).toBeFalsy();
  });

  it('should reset filter', () => {
    component.getFilterControl('name1')?.setValue('testValue');
    component.resetFilter({filterName: 'name1', filterType: FilterType.Search });
    expect(component.getFilterControl('name1')?.value).toBe('');
  });
});
