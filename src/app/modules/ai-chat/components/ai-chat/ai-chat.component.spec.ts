import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AiChatComponent} from './ai-chat.component';
import {AiChatService} from "../../services/ai-chat.service";
import {EMPTY, Subject} from "rxjs";
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockProvider} from "ng-mocks";
import {SuggestionsService} from "../../services/suggestions.service";
import {ChatContainerComponent} from "../chat-container/chat-container.component";
import {UsageDisclaimerComponent} from "../usage-disclaimer/usage-disclaimer.component";
import {
  StartNewConversationButtonComponent
} from "../start-new-conversation-button/start-new-conversation-button.component";
import {ChatMessageContainerComponent} from "../chat-message-container/chat-message-container.component";
import {
  ChatSuggestedMessageContainerComponent
} from "../chat-suggested-message-container/chat-suggested-message-container.component";
import {MessageInputComponent} from "../message-input/message-input.component";

describe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        AiChatComponent,
        MockComponents(
          ChatContainerComponent,
          UsageDisclaimerComponent,
          StartNewConversationButtonComponent,
          ChatMessageContainerComponent,
          ChatSuggestedMessageContainerComponent,
          MessageInputComponent,
        )
      ],
      providers: [
        MockProvider(AiChatService, {
          sendMessage: jasmine.createSpy('sendMessage').and.returnValue(new Subject()),
        }),
        MockProvider(SuggestionsService, {
          getSuggestions: () => EMPTY
        })
      ]
    });
    fixture = TestBed.createComponent(AiChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
