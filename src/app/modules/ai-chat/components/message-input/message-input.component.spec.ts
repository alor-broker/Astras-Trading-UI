import {ComponentFixture, TestBed} from '@angular/core/testing';

import {MessageInputComponent} from './message-input.component';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {FormsTesting} from "../../../../shared/utils/testing/forms-testing";
import {MockComponents} from "ng-mocks";

describe('MessageInputComponent', () => {
  let component: MessageInputComponent;
  let fixture: ComponentFixture<MessageInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MessageInputComponent,
        ...FormsTesting.getMocks(),
        MockComponents(
          NzButtonComponent
        )
      ]
    });
    fixture = TestBed.createComponent(MessageInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
