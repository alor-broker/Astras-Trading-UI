import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FinanceBarChartComponent } from './finance-bar-chart.component';

describe('FinanceBarChartComponent', () => {
  let component: FinanceBarChartComponent;
  let fixture: ComponentFixture<FinanceBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FinanceBarChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
