import {
  Component,
  DestroyRef,
  OnInit
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay
} from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import {
  filter,
  finalize
} from 'rxjs/operators';
import { NewFeedback } from '../../models/feedback.model';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

@Component({
  selector: 'ats-feedback-widget',
  templateUrl: './feedback-widget.component.html',
  styleUrls: ['./feedback-widget.component.less']
})
export class FeedbackWidgetComponent implements OnInit {
  isVisible$: Observable<boolean> = of(false);
  readonly commentMaxLength = 5000;
  readonly maxStarsCount = 5;
  askComment = false;
  form?: UntypedFormGroup;

  voteParams$!: Observable<NewFeedback>;

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService,
    private readonly notificationService: NzNotificationService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowVoteModal$;

    this.voteParams$ = this.modalService.voteParams$.pipe(
      filter((x): x is NewFeedback => !!x),
      shareReplay(1)
    );

    this.voteParams$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      this.initForm(params);
    });
  }

  handleClose(): void {
    this.modalService.closeVoteModal();
  }

  initForm(params: NewFeedback): void {
    this.askComment = false;
    this.form = new UntypedFormGroup({
      rating: new UntypedFormControl(null, Validators.required),
      comment: new UntypedFormControl(null, [Validators.maxLength(this.commentMaxLength)]),
      code: new UntypedFormControl(params.code)
    });
  }

  submitFeedback(): void {
    if (!(this.form?.valid ?? false)) {
      return;
    }

    if (!this.askComment) {
      if (this.checkAskComment()) {
        return;
      }
    }

    this.feedbackService.submitFeedback(this.form!.value!).pipe(
      finalize(() => {
        this.modalService.closeVoteModal();
      })
    ).subscribe(() => {
      this.notificationService.success('Оценка приложения', 'Спасибо! Ваш голос важен для нас.');
      this.feedbackService.removeUnansweredFeedback();
    });
  }

  checkAskComment(): boolean {
    this.askComment = this.form?.value.rating < this.maxStarsCount && (this.form?.value.comment ?? '').length === 0;
    return this.askComment;
  }
}
