import {ComponentFixture, TestBed} from '@angular/core/testing';

import {StartNewConversationButtonComponent} from './start-new-conversation-button.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {MockComponents, MockDirectives} from "ng-mocks";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";

describe('StartNewConversationButtonComponent', () => {
  let component: StartNewConversationButtonComponent;
  let fixture: ComponentFixture<StartNewConversationButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslocoTestsModule.getModule(),
        StartNewConversationButtonComponent,
        MockComponents(
          NzButtonComponent
        ),
        MockDirectives(
          NzTooltipDirective,
          NzIconDirective
        )
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
