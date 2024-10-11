import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardChartsLayoutComponent } from './option-board-charts-layout.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('OptionBoardChartsLayoutComponent', () => {
  let component: OptionBoardChartsLayoutComponent;
  let fixture: ComponentFixture<OptionBoardChartsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
      declarations: [
        OptionBoardChartsLayoutComponent,
        ComponentHelpers.mockComponent({
          selector: 'ats-option-board-chart',
          inputs: ['dataContext']
        }),
        ComponentHelpers.mockComponent({
          selector: 'nz-alert',
          inputs: ['nzType', 'nzCloseable', 'nzMessage']
        })
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
