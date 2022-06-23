import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsModalWidgetComponent } from './news-modal-widget.component';
import { NewsService } from "../../services/news.service";
import { BehaviorSubject, of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";

describe('NewsModalWidgetComponent', () => {
  const testNewsItem = {
    id: 1,
    title: 'Some news 1',
    pubDate: 'some date'
  };

  let component: NewsModalWidgetComponent;
  let fixture: ComponentFixture<NewsModalWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewsModalWidgetComponent ],
      providers: [
        {
          provide: NewsService,
          useValue: {
            getNewsItemInfo: jasmine.createSpy('getNewsSub').and.returnValue(of(testNewsItem)),
          }
        },
        {
          provide: ModalService,
          useValue: {
            shouldShowNewsModal$: new BehaviorSubject(false),
            newsId$: new BehaviorSubject(testNewsItem.id),
            closeNewsModal: jasmine.createSpy('getNewsSub').and.callThrough(),
          }
        }
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsModalWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
