import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { TechChartWidgetComponent } from './tech-chart-widget.component';
import { DashboardItem } from "../../../../shared/models/dashboard-item.model";
import { EventEmitter } from "@angular/core";
import { mockComponent } from "../../../../shared/utils/testing";

describe('TechChartWidgetComponent', () => {
  let component: TechChartWidgetComponent;
  let fixture: ComponentFixture<TechChartWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        TechChartWidgetComponent,
        mockComponent({
          selector: 'ats-tech-chart',
          inputs: ['guid', 'contentSize', 'shouldShowSettings']
        })
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechChartWidgetComponent);
    component = fixture.componentInstance;

    component.resize = new EventEmitter<DashboardItem>();

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
