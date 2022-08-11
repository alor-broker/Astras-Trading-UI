import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { InfiniteScrollTableComponent } from './infinite-scroll-table.component';
import { ngZorroMockComponents } from "../../utils/testing";

xdescribe('InfiniteScrollTableComponent', () => {
  let component: InfiniteScrollTableComponent;
  let fixture: ComponentFixture<InfiniteScrollTableComponent>;

  const testColumns = [
    { displayName: 'name1', name: 'name1', isFiltering: true },
    { displayName: 'name2', name: 'name2', isFiltering: false }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        InfiniteScrollTableComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InfiniteScrollTableComponent);
    component = fixture.componentInstance;
    component.columns = testColumns;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add controls to filters form', () => {
    expect(component.filtersForm.get('name1')).toBeTruthy();
    expect(component.filtersForm.get('name2')).toBeFalsy();
  });

  it('should apply filter', fakeAsync(() => {
    const filterAppliedSpy = spyOn(component.filterApplied, 'emit').and.callThrough();

    component.filtersForm.get('name1')?.setValue('testValue');
    tick(300);

    expect(filterAppliedSpy).toHaveBeenCalledOnceWith({name1: 'testValue'});
  }));
});
