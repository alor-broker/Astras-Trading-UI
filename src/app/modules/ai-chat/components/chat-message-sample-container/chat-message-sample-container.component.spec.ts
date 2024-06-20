import {
  ComponentFixture,
  TestBed
} from '@angular/core/testing';

import { ChatMessageSampleContainerComponent } from './chat-message-sample-container.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { mockComponent } from "../../../../shared/utils/testing";

describe('ChatMessageSampleContainerComponent', () => {
  let component: ChatMessageSampleContainerComponent;
  let fixture: ComponentFixture<ChatMessageSampleContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule],
      declarations: [
        ChatMessageSampleContainerComponent,
        mockComponent({selector: 'ats-text-message', inputs: ['content']}),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ChatMessageSampleContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
