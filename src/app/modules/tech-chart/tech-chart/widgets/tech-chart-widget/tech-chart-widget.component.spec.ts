import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechChartWidgetComponent } from './tech-chart-widget.component';

describe('TechChartWidgetComponent', () => {
  let component: TechChartWidgetComponent;
  let fixture: ComponentFixture<TechChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TechChartWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
