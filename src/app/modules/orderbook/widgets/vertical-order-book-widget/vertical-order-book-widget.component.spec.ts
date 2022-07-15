import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerticalOrderBookWidgetComponent } from './vertical-order-book-widget.component';

describe('VerticalOrderBookWidgetComponent', () => {
  let component: VerticalOrderBookWidgetComponent;
  let fixture: ComponentFixture<VerticalOrderBookWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ VerticalOrderBookWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VerticalOrderBookWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
