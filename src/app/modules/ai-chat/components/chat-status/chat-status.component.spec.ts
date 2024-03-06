import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatStatusComponent } from './chat-status.component';

describe('ChatStatusComponent', () => {
  let component: ChatStatusComponent;
  let fixture: ComponentFixture<ChatStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ChatStatusComponent]
    });
    fixture = TestBed.createComponent(ChatStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
