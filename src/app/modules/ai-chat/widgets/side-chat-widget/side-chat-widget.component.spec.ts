import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SideChatWidgetComponent } from './side-chat-widget.component';
import {
  getTranslocoModule,
  mockComponent,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('SideChatWidgetComponent', () => {
  let component: SideChatWidgetComponent;
  let fixture: ComponentFixture<SideChatWidgetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        SideChatWidgetComponent,
        mockComponent({selector: 'ats-ai-chat'}),
        mockComponent({selector: 'ats-terms-of-use-dialog-widget', inputs: ['atsVisible']}),
        ...ngZorroMockComponents
      ]
    });
    fixture = TestBed.createComponent(SideChatWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
