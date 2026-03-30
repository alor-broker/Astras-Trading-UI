import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardChartsLayoutComponent } from './option-board-charts-layout.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {OptionBoardChartComponent} from "../option-board-chart/option-board-chart.component";
import {NzAlertComponent} from "ng-zorro-antd/alert";
import {Subject} from "rxjs";
import {OptionParameters, OptionSide} from "../../models/option-board.model";
import {
  OptionBoardDataContext,
  OptionsSelection,
  SelectionParameters
} from "../../models/option-board-data-context.model";

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
    fixture.componentRef.setInput(
      'dataContext',
      {
        settings$: new Subject(),
        selectedSide$: new Subject<OptionSide>(),
        selectedParameter$: new Subject<OptionParameters>(),
        optionsSelection$: new Subject<OptionsSelection[]>(),
        currentSelection$: new Subject<OptionsSelection>(),
        selectionParameters$: new Subject<Map<string, Partial<SelectionParameters>>>(),
        updateOptionSelection: () => {
        },
        clearCurrentSelection: () => {
        },
        removeItemFromSelection: () => {
        },
        setParameters: () => {
        },
        destroy: () => {
        }
      } as OptionBoardDataContext
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
