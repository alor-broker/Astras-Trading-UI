import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalOrderBookComponent } from './vertical-order-book.component';

describe('VerticalOrderBookComponent', () => {
  let component: VerticalOrderBookComponent;
  let fixture: ComponentFixture<VerticalOrderBookComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerticalOrderBookComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalOrderBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
