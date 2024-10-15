import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AiChatComponent } from './ai-chat.component';
import { AiChatService } from "../../services/ai-chat.service";
import { Subject } from "rxjs";
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ComponentHelpers } from "../../../../shared/utils/testing/component-helpers";

describe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
      ],
      declarations: [
        AiChatComponent,
        ComponentHelpers.mockComponent({ selector: 'ats-chat-container' }),
        ComponentHelpers.mockComponent({ selector: 'ats-chat-message-container', inputs: ['message'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-chat-status', inputs: ['status'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-message-input', inputs: ['messagePlaceholder', 'atsDisabled'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-chat-suggested-message-container', inputs: ['suggestedMessage'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-start-new-conversation-button', inputs: ['atsDisabled'] }),
        ComponentHelpers.mockComponent({ selector: 'ats-usage-disclaimer'})
      ],
      providers: [
        {
          provide: AiChatService,
          useValue: {
            sendMessage: jasmine.createSpy('sendMessage').and.returnValue(new Subject()),
            getSuggestions: jasmine.createSpy('getSuggestions').and.returnValue(new Subject())
          }
        }
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
