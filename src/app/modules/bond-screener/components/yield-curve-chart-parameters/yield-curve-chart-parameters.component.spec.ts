import { ComponentFixture, TestBed } from '@angular/core/testing';

import { YieldCurveChartParametersComponent } from './yield-curve-chart-parameters.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { commonTestProviders } from "../../../../shared/utils/testing/common-test-providers";
import { FormsTesting } from "../../../../shared/utils/testing/forms-testing";
import { NzTooltipModule } from "ng-zorro-antd/tooltip";

describe('YieldCurveChartParametersComponent', () => {
  let component: YieldCurveChartParametersComponent;
  let fixture: ComponentFixture<YieldCurveChartParametersComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [
        TranslocoTestsModule.getModule(),
        ...FormsTesting.getMocks(),
        NzTooltipModule,
        YieldCurveChartParametersComponent
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
