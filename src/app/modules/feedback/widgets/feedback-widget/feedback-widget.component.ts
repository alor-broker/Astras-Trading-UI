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
  FormBuilder,
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
  readonly form = this.formBuilder.group({
    rating: this.formBuilder.nonNullable.control<number | null>(null, Validators.required),
    comment: this.formBuilder.nonNullable.control('', [Validators.maxLength(this.commentMaxLength)]),
    code: this.formBuilder.nonNullable.control('')
  });

  voteParams$!: Observable<NewFeedback>;

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService,
    private readonly notificationService: NzNotificationService,
    private readonly formBuilder: FormBuilder,
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
    this.form.reset();

    this.form.controls.code.setValue(params.code);
  }

  submitFeedback(): void {
    if (!this.form.valid) {
      return;
    }

    if (!this.askComment) {
      this.checkAskComment();
      if (this.askComment) {
        return;
      }
    }

    this.feedbackService.submitFeedback({
      code: this.form.value.code ?? '',
      rating: this.form.value.rating!,
      comment: this.form.value.comment ?? ''
    }).pipe(
      finalize(() => {
        this.modalService.closeVoteModal();
      })
    ).subscribe(() => {
      this.notificationService.success('Оценка приложения', 'Спасибо! Ваш голос важен для нас.');
      this.feedbackService.removeUnansweredFeedback();
    });
  }

  checkAskComment(): void {
    this.askComment = this.form.value.rating != null
    && this.form.value.rating < this.maxStarsCount
    && (this.form.value.comment ?? '').length === 0;
  }
}
