import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewEncapsulation
} from '@angular/core';
import {FeedbackService} from '../../services/feedback.service';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {
  finalize,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import {NewFeedback} from '../../types/feedback.types';
import {filter} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {AsyncPipe} from '@angular/common';
import {
  NzModalComponent,
  NzModalContentDirective
} from 'ng-zorro-antd/modal';
import {TranslocoDirective} from '@jsverse/transloco';
import {
  NzFormControlComponent,
  NzFormDirective,
  NzFormItemComponent,
  NzFormLabelComponent
} from 'ng-zorro-antd/form';
import {NzRateComponent} from 'ng-zorro-antd/rate';
import {
  NzInputDirective,
  NzTextareaCountComponent
} from 'ng-zorro-antd/input';
import {
  NzColDirective,
  NzRowDirective
} from 'ng-zorro-antd/grid';

@Component({
  selector: 'ats-feedback-dialog',
  imports: [
    TranslocoDirective,
    NzModalComponent,
    NzModalContentDirective,
    FormsModule,
    NzFormDirective,
    ReactiveFormsModule,
    NzRowDirective,
    NzFormItemComponent,
    NzColDirective,
    NzFormLabelComponent,
    NzFormControlComponent,
    NzRateComponent,
    NzTextareaCountComponent,
    NzInputDirective,
    AsyncPipe
  ],
  templateUrl: './feedback-dialog.html',
  styleUrl: './feedback-dialog.less',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeedbackDialog implements OnInit {
  isVisible$: Observable<boolean> = of(false);

  readonly commentMaxLength = 5000;

  readonly maxStarsCount = 5;

  askComment = false;

  voteParams$!: Observable<NewFeedback | null>;

  private readonly feedbackService = inject(FeedbackService);

  private readonly notificationService = inject(NzNotificationService);

  private readonly formBuilder = inject(FormBuilder);

  readonly form = this.formBuilder.group({
    rating: this.formBuilder.nonNullable.control<number | null>(null, Validators.required),
    comment: this.formBuilder.nonNullable.control('', [Validators.maxLength(this.commentMaxLength)]),
    code: this.formBuilder.nonNullable.control('')
  });

  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.voteParams$ = this.feedbackService.voteParams$.pipe(
      shareReplay(1)
    );

    this.voteParams$.pipe(
      filter((x): x is NewFeedback => !!x),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(params => {
      this.initForm(params);
    });
  }

  handleClose(): void {
    this.feedbackService.closeVoteDialog();
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
        this.feedbackService.closeVoteDialog();
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
