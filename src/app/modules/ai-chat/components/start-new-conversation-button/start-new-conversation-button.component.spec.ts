import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartNewConversationButtonComponent } from './start-new-conversation-button.component';
import {
  getTranslocoModule,
  ngZorroMockComponents
} from "../../../../shared/utils/testing";

describe('StartNewConversationButtonComponent', () => {
  let component: StartNewConversationButtonComponent;
  let fixture: ComponentFixture<StartNewConversationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [getTranslocoModule()],
      declarations: [
        StartNewConversationButtonComponent,
        ...ngZorroMockComponents
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StartNewConversationButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
