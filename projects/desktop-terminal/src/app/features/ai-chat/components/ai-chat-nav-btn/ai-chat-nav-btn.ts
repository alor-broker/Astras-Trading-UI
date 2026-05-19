import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  ViewEncapsulation
} from '@angular/core';
import {EnvironmentService} from '../../../../services/environment.service';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzTooltipDirective} from 'ng-zorro-antd/tooltip';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {AiChatSidePanel} from '../ai-chat-side-panel/ai-chat-side-panel';

@Component({
  selector: 'atsd-ai-chat-nav-btn',
  imports: [
    NzButtonComponent,
    TranslocoDirective,
    NzTooltipDirective,
    NzIconDirective,
    AiChatSidePanel
  ],
  templateUrl: './ai-chat-nav-btn.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AiChatNavBtn {
  protected readonly aiChatVisible = model(false);

  private readonly environmentService = inject(EnvironmentService);

  protected readonly aiChatAvailable = this.environmentService.features["aiChat"] ?? false;
}
