import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { FinanceComponent } from './finance.component';
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents} from "ng-mocks";
import {FinanceBarChartComponent} from "../finance-bar-chart/finance-bar-chart.component";
import {DescriptorsListComponent} from "../../descriptors-list/descriptors-list.component";

describe('FinanceComponent', () => {
  let component: FinanceComponent;
  let fixture: ComponentFixture<FinanceComponent>;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FinanceComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          FinanceBarChartComponent,
          DescriptorsListComponent
        )
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FinanceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'stockInfo',
      {}
    );
  });

  afterEach(() => fixture?.destroy());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
