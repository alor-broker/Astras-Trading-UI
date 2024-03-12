import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextMessageComponent } from './text-message.component';

describe('TextMessageComponent', () => {
  let component: TextMessageComponent;
  let fixture: ComponentFixture<TextMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TextMessageComponent]
    });
    fixture = TestBed.createComponent(TextMessageComponent);
    component = fixture.componentInstance;

    component.content = {
      text: 'text'
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
