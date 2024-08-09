import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScrollableRowComponent } from './scrollable-row.component';

describe('ScrollableRowComponent', () => {
  let component: ScrollableRowComponent;
  let fixture: ComponentFixture<ScrollableRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScrollableRowComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScrollableRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
