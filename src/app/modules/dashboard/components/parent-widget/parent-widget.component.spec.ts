import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParentWidgetComponent } from './parent-widget.component';

describe('ParentWidgetComponent', () => {
  let component: ParentWidgetComponent;
  let fixture: ComponentFixture<ParentWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ParentWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ParentWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
