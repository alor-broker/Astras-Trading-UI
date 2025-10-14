import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsComponent } from './news.component';
import { MockProvider } from "ng-mocks";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { EMPTY } from "rxjs";
import { NewsService } from "../../../../shared/services/news.service";
import { PositionsService } from "../../../../shared/services/positions.service";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NewsComponent,
        TranslocoTestsModule.getModule()
      ],
      providers: [
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: EMPTY
          }
        ),
        MockProvider(
          NewsService,
          {
            getNews: () => EMPTY
          }
        ),
        MockProvider(
          PositionsService,
          {
            getAllByPortfolio: () => EMPTY
          }
        )
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
