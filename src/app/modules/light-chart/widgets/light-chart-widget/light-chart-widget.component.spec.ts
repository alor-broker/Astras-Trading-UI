import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { LightChartWidgetComponent } from './light-chart-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('LightChartWidgetComponent', () => {
  let component: LightChartWidgetComponent;
  let fixture: ComponentFixture<LightChartWidgetComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        LightChartWidgetComponent,
        mockComponent({
          selector: 'ats-light-chart',
          inputs: ['guid', 'resize', 'shouldShowSettings']
        })
      ],
      providers: []
    })
      .compileComponents();

    TestBed.overrideComponent(LightChartWidgetComponent, {
      set: {
        providers: []
      }
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LightChartWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
