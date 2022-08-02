import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechChartComponent } from './tech-chart.component';

describe('TechChartComponent', () => {
  let component: TechChartComponent;
  let fixture: ComponentFixture<TechChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TechChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
