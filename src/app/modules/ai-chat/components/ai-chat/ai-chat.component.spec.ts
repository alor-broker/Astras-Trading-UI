import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { AiChatComponent } from './ai-chat.component';
import {
  getTranslocoModule,
  mockComponent
} from "../../../../shared/utils/testing";
import { AiChatService } from "../../services/ai-chat.service";
import { Subject } from "rxjs";

describe('AiChatComponent', () => {
  let component: AiChatComponent;
  let fixture: ComponentFixture<AiChatComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        getTranslocoModule(),
      ],
      declarations: [
        AiChatComponent,
        mockComponent({ selector: 'ats-chat-container' }),
        mockComponent({ selector: 'ats-chat-message-container', inputs: ['message'] }),
        mockComponent({ selector: 'ats-chat-status', inputs: ['status'] }),
        mockComponent({ selector: 'ats-message-input', inputs: ['messagePlaceholder'] }),
        mockComponent({ selector: 'ats-chat-suggested-message-container', inputs: ['suggestedMessage'] })
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
