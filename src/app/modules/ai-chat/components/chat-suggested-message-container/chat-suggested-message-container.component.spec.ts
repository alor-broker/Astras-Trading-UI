import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ChatSuggestedMessageContainerComponent} from './chat-suggested-message-container.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MockComponents} from "ng-mocks";
import {TextMessageComponent} from "../messages/text-message/text-message.component";

describe('ChatSuggestedMessageContainerComponent', () => {
  let component: ChatSuggestedMessageContainerComponent;
  let fixture: ComponentFixture<ChatSuggestedMessageContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ChatSuggestedMessageContainerComponent,
        MockComponents(
          TextMessageComponent
        )
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChatSuggestedMessageContainerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'suggestedMessage',
      {
        text: ''
      }
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
