import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldCurveChartParametersComponent } from './yield-curve-chart-parameters.component';
import {
  commonTestProviders,
  getTranslocoModule,
  ngZorroMockComponents,
  sharedModuleImportForTests
} from "../../../../shared/utils/testing";

describe('YieldCurveChartParametersComponent', () => {
  let component: YieldCurveChartParametersComponent;
  let fixture: ComponentFixture<YieldCurveChartParametersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
        sharedModuleImportForTests
      ],
      declarations: [
        YieldCurveChartParametersComponent,
        ...ngZorroMockComponents,
      ],
      providers: [
        ...commonTestProviders
      ]
    });
    fixture = TestBed.createComponent(YieldCurveChartParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
