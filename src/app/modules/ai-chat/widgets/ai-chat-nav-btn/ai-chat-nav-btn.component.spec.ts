import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatNavBtnComponent } from './ai-chat-nav-btn.component';
import {TranslocoTestsModule} from "../../../../shared/utils/testing/translocoTestsModule";
import {provideHttpClient} from "@angular/common/http";
import {MockModule, MockProvider} from "ng-mocks";
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {AiChatModule} from "../../ai-chat.module";

describe('AiChatNavBtnComponent', () => {
  let component: AiChatNavBtnComponent;
  let fixture: ComponentFixture<AiChatNavBtnComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AiChatNavBtnComponent,
        TranslocoTestsModule.getModule(),
        MockModule(AiChatModule)
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
