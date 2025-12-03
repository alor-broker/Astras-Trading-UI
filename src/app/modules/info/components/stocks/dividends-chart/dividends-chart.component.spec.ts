import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { DividendsChartComponent } from './dividends-chart.component';
import { MockProvider } from "ng-mocks";
import { TranslocoTestsModule } from "../../../../../shared/utils/testing/translocoTestsModule";
import { ThemeService } from "../../../../../shared/services/theme.service";
import { EMPTY } from "rxjs";

describe('DividendsChartComponent', () => {
  let component: DividendsChartComponent;
  let fixture: ComponentFixture<DividendsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        DividendsChartComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          ThemeService,
          {
            getThemeSettings: () => EMPTY
          }
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(DividendsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
