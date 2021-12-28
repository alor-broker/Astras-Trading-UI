import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LimitCommandWidgetComponent } from './limit-command-widget.component';

describe('LimitCommandWidgetComponent', () => {
  let component: LimitCommandWidgetComponent;
  let fixture: ComponentFixture<LimitCommandWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LimitCommandWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LimitCommandWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
