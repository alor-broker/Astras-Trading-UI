import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextMessageComponent } from './text-message.component';
import { ComponentHelpers } from "../../../../../shared/utils/testing/component-helpers";

describe('TextMessageComponent', () => {
  let component: TextMessageComponent;
  let fixture: ComponentFixture<TextMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        TextMessageComponent,
        ComponentHelpers.mockComponent({ selector: 'markdown', inputs: ['data', 'inline'] })
      ]
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
