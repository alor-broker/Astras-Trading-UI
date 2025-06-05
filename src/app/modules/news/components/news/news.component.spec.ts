import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import {NewsComponent} from './news.component';
import {
  NEVER,
  of,
  Subject
} from "rxjs";
import {ModalService} from "../../../../shared/services/modal.service";
import {WidgetSettingsService} from "../../../../shared/services/widget-settings.service";
import {DashboardContextService} from "../../../../shared/services/dashboard-context.service";
import {PositionsService} from "../../../../shared/services/positions.service";
import {LetDirective} from "@ngrx/component";
import {ngZorroMockComponents} from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import {ComponentHelpers} from "../../../../shared/utils/testing/component-helpers";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponent} from "ng-mocks";
import {NewsDialogComponent} from "../news-dialog/news-dialog.component";
import {NewsService} from "../../../../shared/services/news.service";

describe('NewsComponent', () => {
  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NewsComponent,
        ...ngZorroMockComponents,
        ComponentHelpers.mockComponent({
          selector: 'ats-infinite-scroll-table',
          inputs: ['data', 'isLoading', 'tableConfig', 'tableContainerHeight', 'tableContainerWidth']
        }),
        MockComponent(NewsDialogComponent)
      ],
      imports: [
        TranslocoTestsModule.getModule(),
        LetDirective
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
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    component.guid = 'testGuid';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
