import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableSearchFilterComponent } from './table-search-filter.component';

describe('TableSearchFilterComponent', () => {
  let component: TableSearchFilterComponent;
  let fixture: ComponentFixture<TableSearchFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableSearchFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableSearchFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
