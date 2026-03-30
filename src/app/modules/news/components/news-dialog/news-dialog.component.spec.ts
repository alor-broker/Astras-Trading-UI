import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NewsDialogComponent} from "./news-dialog.component";
import {NzModalModule} from "ng-zorro-antd/modal";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {NewsListItem} from "../../../../shared/services/news.service";

describe('NewsDialogComponent', () => {
  let component: NewsDialogComponent;
  let fixture: ComponentFixture<NewsDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        NewsDialogComponent,
        NzModalModule,
        BrowserAnimationsModule
      ],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'newsItem',
      {
        id: ''
      } as NewsListItem
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
