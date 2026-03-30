import {ComponentFixture, TestBed} from '@angular/core/testing';

import {TextMessageComponent} from './text-message.component';
import {MockComponents} from "ng-mocks";
import {MarkdownComponent} from "ngx-markdown";

describe('TextMessageComponent', () => {
  let component: TextMessageComponent;
  let fixture: ComponentFixture<TextMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TextMessageComponent,
        MockComponents(
          MarkdownComponent
        )
      ]
    });
    fixture = TestBed.createComponent(TextMessageComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'content',
      {
        text: 'text'
      }
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
