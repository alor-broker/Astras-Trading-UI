import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightChartWidgetComponent } from './light-chart-widget.component';

describe('LightChartWidgetComponent', () => {
  let component: LightChartWidgetComponent;
  let fixture: ComponentFixture<LightChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LightChartWidgetComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
