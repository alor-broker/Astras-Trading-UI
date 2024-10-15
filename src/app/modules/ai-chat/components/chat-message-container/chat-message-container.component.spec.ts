import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ChatMessageContainerComponent } from './chat-message-container.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import {
  MessageType,
  TextMessageContent
} from "../../models/messages-display.model";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('ChatMessageContainerComponent', () => {
  let component: ChatMessageContainerComponent;
  let fixture: ComponentFixture<ChatMessageContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule],
      declarations: [
        ChatMessageContainerComponent,
        ComponentHelpers.mockComponent({selector: 'ats-text-message', inputs: ['content']}),
        ...ngZorroMockComponents
      ]
    });
    fixture = TestBed.createComponent(ChatMessageContainerComponent);
    component = fixture.componentInstance;

    component.message = {
      date: new Date(),
      isMe: false,
      messageType: MessageType.Text,
      content: {
        text: 'text'
      } as TextMessageContent
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
