import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfiniteScrollTableComponent } from './infinite-scroll-table.component';
import { ngZorroMockComponents } from "../../utils/testing";

describe('InfiniteScrollTableComponent', () => {
  let component: InfiniteScrollTableComponent;
  let fixture: ComponentFixture<InfiniteScrollTableComponent>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
