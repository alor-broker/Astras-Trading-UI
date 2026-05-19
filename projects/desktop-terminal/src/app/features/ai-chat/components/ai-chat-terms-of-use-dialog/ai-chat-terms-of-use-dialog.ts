import {
  ChangeDetectionStrategy,
  Component,
  inject,
  model,
  output,
  ViewEncapsulation
} from '@angular/core';
import {AiChatTermsOfUseService} from '../../services/ai-chat-terms-of-use.service';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzModalComponent,
  NzModalContentDirective,
  NzModalFooterDirective
} from 'ng-zorro-antd/modal';
import {LetDirective} from '@ngrx/component';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzButtonComponent} from 'ng-zorro-antd/button';
import {MarkdownComponent} from 'ngx-markdown';

@Component({
  selector: 'atsd-ai-chat-terms-of-use-dialog',
  imports: [
    TranslocoDirective,
    NzModalComponent,
    LetDirective,
    NzModalContentDirective,
    NzSpinComponent,
    NzModalFooterDirective,
    NzButtonComponent,
    MarkdownComponent
  ],
  templateUrl: './ai-chat-terms-of-use-dialog.html',
  styleUrl: './ai-chat-terms-of-use-dialog.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    AiChatTermsOfUseService
  ]
})
export class AiChatTermsOfUseDialog {
  readonly atsVisible = model(false);

  readonly confirmed = output<boolean>();

  private readonly termsOfUseService = inject(AiChatTermsOfUseService);

  protected readonly content$ = this.termsOfUseService.getContent();

  handleOk(): void {
    this.confirmed.emit(true);
    this.handleClose();
  }

  handleCancel(): void {
    this.confirmed.emit(false);
    this.handleClose();
  }

  private handleClose(): void {
    this.atsVisible.set(false);
  }
}
