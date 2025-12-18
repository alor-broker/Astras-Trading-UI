import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardChartsLayoutComponent } from './option-board-charts-layout.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {OptionBoardChartComponent} from "../option-board-chart/option-board-chart.component";
import {NzAlertComponent} from "ng-zorro-antd/alert";

describe('OptionBoardChartsLayoutComponent', () => {
  let component: OptionBoardChartsLayoutComponent;
  let fixture: ComponentFixture<OptionBoardChartsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
    imports: [
      TranslocoTestsModule.getModule(),
      OptionBoardChartsLayoutComponent,
      MockComponents(
        OptionBoardChartComponent,
        NzAlertComponent
      )
    ]
})
    .compileComponents();

    fixture = TestBed.createComponent(OptionBoardChartsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
