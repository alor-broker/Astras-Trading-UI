import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { NewsComponent } from './news.component';
import { NewsService } from "../../services/news.service";
import { of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import {
  getTranslocoModule,
  mockComponent, ngZorroMockComponents
} from "../../../../shared/utils/testing";
import { WidgetSettingsService } from "../../../../shared/services/widget-settings.service";

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
        getTranslocoModule()
      ],
      providers: [
        {
          provide: NewsService,
          useValue: {
            getNewNews: jasmine.createSpy('getNewsSub').and.returnValue(of([testNewsItem])),
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
