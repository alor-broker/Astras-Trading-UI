import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ChatSuggestedMessageContainerComponent } from './chat-suggested-message-container.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { mockComponent } from "../../../../shared/utils/testing";

describe('ChatMessageSampleContainerComponent', () => {
  let component: ChatSuggestedMessageContainerComponent;
  let fixture: ComponentFixture<ChatSuggestedMessageContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule],
      declarations: [
        ChatSuggestedMessageContainerComponent,
        mockComponent({selector: 'ats-text-message', inputs: ['content']}),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChatSuggestedMessageContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
