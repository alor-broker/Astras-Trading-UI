import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BlotterWidgetComponent } from './blotter-widget.component';

describe('BlotterWidgetComponent', () => {
  let component: BlotterWidgetComponent;
  let fixture: ComponentFixture<BlotterWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BlotterWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BlotterWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
