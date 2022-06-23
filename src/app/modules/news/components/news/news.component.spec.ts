import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsComponent } from './news.component';
import { NewsService } from "../../services/news.service";
import { of } from "rxjs";
import { ModalService } from "../../../../shared/services/modal.service";
import { EventEmitter } from "@angular/core";

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
      declarations: [NewsComponent],
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
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsComponent);
    component = fixture.componentInstance;
    component.resize = new EventEmitter();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
