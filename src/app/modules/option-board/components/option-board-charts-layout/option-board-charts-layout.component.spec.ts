import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OptionBoardChartsLayoutComponent } from './option-board-charts-layout.component';
import {
  getTranslocoModule,
  mockComponent
} from "../../../../shared/utils/testing";

describe('OptionBoardChartsLayoutComponent', () => {
  let component: OptionBoardChartsLayoutComponent;
  let fixture: ComponentFixture<OptionBoardChartsLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        OptionBoardChartsLayoutComponent,
        mockComponent({
          selector: 'ats-option-board-chart',
          inputs: ['dataContext']
        }),
        mockComponent({
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
