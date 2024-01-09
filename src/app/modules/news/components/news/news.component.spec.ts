import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { NewsComponent } from './news.component';
import { NewsService } from "../../services/news.service";
import {
  of,
  Subject
} from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import {
  getTranslocoModule,
  mockComponent, ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";
import { DashboardContextService } from "../../../../shared/services/dashboard-context.service";
import { PositionsService } from "../../../../shared/services/positions.service";
import { LetDirective } from "@ngrx/component";

describe('NewsComponent', () => {
  const testNewsItem = {
    id: 1,
    title: 'Some news 1',
    pubDate: 'some date'
  };

  let component: NewsComponent;
  let fixture: ComponentFixture<NewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NewsComponent,
        ...ngZorroMockComponents,
        mockComponent({
          selector: 'ats-infinite-scroll-table',
          inputs: ['data', 'isLoading', 'tableConfig', 'tableContainerHeight', 'tableContainerWidth']
        })
      ],
      imports: [
        getTranslocoModule(),
        LetDirective
      ],
      providers: [
        {
          provide: NewsService,
          useValue: {
            getNews: jasmine.createSpy('getNews').and.returnValue(of([testNewsItem]))
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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
