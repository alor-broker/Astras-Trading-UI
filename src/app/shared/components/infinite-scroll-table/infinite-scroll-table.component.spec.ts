import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteScrollTableComponent } from './infinite-scroll-table.component';
import { NzTableModule } from "ng-zorro-antd/table";
import { NzDropDownModule } from "ng-zorro-antd/dropdown";
import { By } from "@angular/platform-browser";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { ColumnsSettings } from "../../models/columns-settings.model";
import { UntypedFormControl } from "@angular/forms";

@Component({
  template: `
    <ats-infinite-scroll-table
      [tableContainerHeight]="tableContainerHeight"
      [tableContainerWidth]="tableContainerWidth"
      [data]="testData"
      [isLoading]="isLoading"
      [columns]="testColumns"
      [trackByFn]="trackByFn"
      (scrolled)="scrolled()"
      (filterApplied)="applyFilter($event)"
      (rowClick)="rowClick($event)"
    >
    </ats-infinite-scroll-table>
  `
})
class TestWrapperComponent implements OnInit {
  constructor(private cdr: ChangeDetectorRef) {
  }
  tableContainerHeight = 50;
  tableContainerWidth = 50;
  isLoading = true;
  testColumns: ColumnsSettings[] = [
    { displayName: 'name1', name: 'name1', filterData: { filterName: 'name1' }, width: '50px' },
    { displayName: 'name2', name: 'name2' },
  ];
  testData: any[] = [
    {name1: 'testName1', name2: 'testName2', id: 1},
    {name1: 'testName1', name2: 'testName2', id: 2},
    {name1: 'testName1', name2: 'testName2', id: 3},
    {name1: 'testName1', name2: 'testName2', id: 4},
  ];
  trackByFn = (e: any) => e.name;

  applyFilter(e: any) {}
  scrolled() {}
  rowClick(e: any) {}

  ngOnInit() {
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
        TestWrapperComponent
      ],
      imports: [
        NoopAnimationsModule,
        NzTableModule,
        NzDropDownModule
      ]
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
    expect(component.columns).toBe(wrapperComp.testColumns);
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
    expect(component.getWidthArr()).toEqual(wrapperComp.testColumns.map((col: ColumnsSettings) => col.width || 'auto'));
  });

  it('should return filter control', () => {
    expect(component.getFilterControl('name1')).toEqual(component.filtersForm.get('name1') as UntypedFormControl);
    expect(component.getFilterControl('notExistingName')).toBeFalsy();
  });

  it('should reset filter', () => {
    component.getFilterControl('name1').setValue('testValue');
    component.resetFilter({filterName: 'name1'});
    expect(component.getFilterControl('name1').value).toBe('');
  });
});
