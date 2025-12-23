import {ComponentFixture, TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';

import {AiChatComponent} from './ai-chat.component';
import {AiChatService} from "../../services/ai-chat.service";
import {EMPTY, Subject} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockBuilder, MockInstance} from "ng-mocks";
import {SuggestionsService} from "../../services/suggestions.service";
import {ChatContainerComponent} from "../chat-container/chat-container.component";
import {MessageInputComponent} from "../message-input/message-input.component";

xdescribe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;

  beforeEach(() => {
    MockInstance(ChatContainerComponent, (instance) => {
      (instance as any).messagesContainer = signal(undefined);
      (instance as any).messages = signal([]);
    });
    MockInstance(MessageInputComponent, (instance) => {
      (instance as any).inputElement = signal(undefined);
    });

    return MockBuilder(AiChatComponent)
      .keep(TranslocoTestsModule.getModule())
      .mock(AiChatService, {
        sendMessage: jasmine.createSpy('sendMessage').and.returnValue(new Subject()),
      })
      .mock(SuggestionsService, {
        getSuggestions: () => EMPTY
      });
  });

  it('should create', () => {
    fixture = TestBed.createComponent(AiChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
