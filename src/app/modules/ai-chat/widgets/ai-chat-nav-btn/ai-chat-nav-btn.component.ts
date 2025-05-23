import {
  ChangeDetectionStrategy,
  Component
} from '@angular/core';
import {NzButtonComponent} from "ng-zorro-antd/button";
import {NzTooltipDirective} from "ng-zorro-antd/tooltip";
import {NzIconDirective} from "ng-zorro-antd/icon";
import {TranslocoDirective} from "@jsverse/transloco";
import {EnvironmentService} from "../../../../shared/services/environment.service";
import {AiChatModule} from "../../ai-chat.module";

@Component({
    selector: 'ats-ai-chat-nav-btn',
    imports: [
        NzButtonComponent,
        NzTooltipDirective,
        NzIconDirective,
        TranslocoDirective,
        AiChatModule
    ],
    templateUrl: './ai-chat-nav-btn.component.html',
    styleUrl: './ai-chat-nav-btn.component.less',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AiChatNavBtnComponent {
  aiChatAvailable = this.environmentService.features.aiChat;
  aiChatVisible = false;

  constructor(private readonly environmentService: EnvironmentService) {
  }
}
