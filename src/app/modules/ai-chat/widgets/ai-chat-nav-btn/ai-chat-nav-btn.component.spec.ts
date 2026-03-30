import {ComponentFixture, TestBed} from '@angular/core/testing';

import {AiChatNavBtnComponent} from './ai-chat-nav-btn.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {provideHttpClient} from "@angular/common/http";
import {MockComponents, MockDirectives, MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TranslocoDirective} from "@jsverse/transloco";
import {SideChatWidgetComponent} from "../side-chat-widget/side-chat-widget.component";

describe('AiChatNavBtnComponent', () => {
  let component: AiChatNavBtnComponent;
  let fixture: ComponentFixture<AiChatNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiChatNavBtnComponent,
        TranslocoTestsModule.getModule(),
        MockComponents(
          NzButtonComponent,
          SideChatWidgetComponent
        ),
        MockDirectives(
          NzTooltipDirective,
          NzIconDirective,
          TranslocoDirective,
        )
      ],
      providers: [
        MockProvider(
          EnvironmentService,
          {
            features: {
              aiChat: true
            }
          }
        ),
        provideHttpClient()
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AiChatNavBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
