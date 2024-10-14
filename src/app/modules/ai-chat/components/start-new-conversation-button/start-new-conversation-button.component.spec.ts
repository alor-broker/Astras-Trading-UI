import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StartNewConversationButtonComponent } from './start-new-conversation-button.component';
import { TranslocoTestsModule } from "../../../../shared/utils/testing/translocoTestsModule";
import { ngZorroMockComponents } from "../../../../shared/utils/testing/ng-zorro-component-mocks";

describe('StartNewConversationButtonComponent', () => {
  let component: StartNewConversationButtonComponent;
  let fixture: ComponentFixture<StartNewConversationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslocoTestsModule.getModule()],
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
