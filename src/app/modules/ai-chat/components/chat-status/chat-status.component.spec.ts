import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChatStatusComponent } from './chat-status.component';

describe('ChatStatusComponent', () => {
  let component: ChatStatusComponent;
  let fixture: ComponentFixture<ChatStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
    imports: [ChatStatusComponent]
});
    fixture = TestBed.createComponent(ChatStatusComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'status',
      null
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
