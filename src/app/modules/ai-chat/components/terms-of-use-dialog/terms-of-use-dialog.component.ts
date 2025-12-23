import {ChangeDetectionStrategy, Component, model, output} from '@angular/core';
import {AiChatTermsOfUseService} from "../../services/ai-chat-terms-of-use.service";
import {TranslocoDirective} from '@jsverse/transloco';
import {NzModalComponent, NzModalContentDirective, NzModalFooterDirective} from 'ng-zorro-antd/modal';
import {LetDirective} from '@ngrx/component';
import {MarkdownComponent} from 'ngx-markdown';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzButtonComponent} from 'ng-zorro-antd/button';

@Component({
  selector: 'ats-terms-of-use-dialog',
  templateUrl: './terms-of-use-dialog.component.html',
  styleUrl: './terms-of-use-dialog.component.less',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    LetDirective,
    MarkdownComponent,
    NzSpinComponent,
    NzModalFooterDirective,
    NzButtonComponent
  ]
})
export class TermsOfUseDialogComponent {
  atsVisible = model(false);

  readonly confirmed = output<boolean>();

  protected readonly content$ = this.termsOfUseService.getContent();

  constructor(private readonly termsOfUseService: AiChatTermsOfUseService) {
  }

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
