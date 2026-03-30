import {ComponentFixture, TestBed} from '@angular/core/testing';

import {NewsComponent} from './news.component';
import {EMPTY, NEVER, of, Subject} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {PositionsService} from "../../../../shared/services/positions.service";
import {LetDirective} from "@ngrx/component";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NewsDialogComponent} from "../news-dialog/news-dialog.component";
import {NewsService} from "../../../../shared/services/news.service";
import {NewsFiltersComponent} from "../news-filters/news-filters.component";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {NavigationStackService} from "../../../../shared/services/navigation-stack.service";
import {NzTabComponent, NzTabsComponent} from "ng-zorro-antd/tabs";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzResizeObserverDirective} from "ng-zorro-antd/cdk/resize-observer";
import {
  InfiniteScrollTableComponent
} from "../../../../shared/components/infinite-scroll-table/infinite-scroll-table.component";
import {GuidGenerator} from "../../../../shared/utils/guid";

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective,
        NewsComponent,
        MockComponents(
          NzButtonComponent,
          NzTabsComponent,
          NzTabComponent,
          InfiniteScrollTableComponent,
          NewsDialogComponent,
          NewsFiltersComponent,
        ),
        MockDirectives(
          NzIconDirective,
          NzResizeObserverDirective
        )
      ],
      providers: [
        {
          provide: NewsService,
          useValue: {
            getNews: jasmine.createSpy('getNews').and.returnValue(NEVER)
          }
        },
        {
          provide: ModalService,
          useValue: {
            openNewsModal: jasmine.createSpy('openNewsModal').and.callThrough()
          }
        },
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({}))
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: new Subject()
          }
        },
        {
          provide: PositionsService,
          useValue: {
            getAllByPortfolio: jasmine.createSpy('getAllByPortfolio').and.returnValue(new Subject())
          }
        },
        {
          provide: NavigationStackService,
          useValue: {
            currentState$: EMPTY
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('guid', GuidGenerator.newGuid());
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
