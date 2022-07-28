import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsWidgetComponent } from './news-widget.component';
import { mockComponent } from "../../../../shared/utils/testing";

describe('NewsWidgetComponent', () => {
  let component: NewsWidgetComponent;
  let fixture: ComponentFixture<NewsWidgetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        NewsWidgetComponent,
        mockComponent({
          selector: 'ats-news',
          inputs: ['resize']
        })
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NewsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
