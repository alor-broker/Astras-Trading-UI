import {ComponentFixture, TestBed} from '@angular/core/testing';

import {ChatMessageContainerComponent} from './chat-message-container.component';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {MessageType, TextMessageContent} from "../../models/messages-display.model";
import {MockComponents} from "ng-mocks";
import {NzAvatarComponent} from "ng-zorro-antd/avatar";
import {TextMessageComponent} from "../messages/text-message/text-message.component";

describe('ChatMessageContainerComponent', () => {
  let component: ChatMessageContainerComponent;
  let fixture: ComponentFixture<ChatMessageContainerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
        ChatMessageContainerComponent,
        MockComponents(
          NzAvatarComponent,
          TextMessageComponent
        )
      ]
    });
    fixture = TestBed.createComponent(ChatMessageContainerComponent);
    component = fixture.componentInstance;

    fixture.componentRef.setInput(
      'message',
      {
        date: new Date(),
        isMe: false,
        messageType: MessageType.Text,
        content: {
          text: 'text'
        } as TextMessageContent
      }
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
