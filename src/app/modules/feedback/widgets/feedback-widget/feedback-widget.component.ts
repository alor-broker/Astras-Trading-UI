import {
  Component,
  OnDestroy,
  OnInit
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay,
  Subject,
  takeUntil
} from 'rxjs';
import { ModalService } from '../../../../shared/services/modal.service';
import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';
import { FeedbackService } from '../../services/feedback.service';
import {
  filter,
  finalize
} from 'rxjs/operators';
import { NewFeedback } from '../../models/feedback.model';

@Component({
  selector: 'ats-feedback-widget',
  templateUrl: './feedback-widget.component.html',
  styleUrls: ['./feedback-widget.component.less']
})
export class FeedbackWidgetComponent implements OnInit, OnDestroy {
  isVisible$: Observable<boolean> = of(false);
  readonly commentMaxLength = 5000;
  readonly maxStarsCount = 5;
  askComment = false;
  form?: FormGroup;

  voteParams$!: Observable<NewFeedback>;

  private readonly destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private readonly modalService: ModalService,
    private readonly feedbackService: FeedbackService
  ) {
  }

  ngOnInit(): void {
    this.isVisible$ = this.modalService.shouldShowVoteModal$;

    this.voteParams$ = this.modalService.voteParams$.pipe(
      filter((x): x is NewFeedback => !!x),
      shareReplay(1)
    );

    this.voteParams$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.initForm(params);
    });
  }

  handleClose() {
    this.modalService.closeVoteModal();
  }

  initForm(params: NewFeedback) {
    this.askComment = false;
    this.form = new FormGroup({
      rate: new FormControl(null, Validators.required),
      comment: new FormControl(null, [Validators.maxLength(this.commentMaxLength)]),
      feedbackCode: new FormControl(params.feedbackCode)
    });
  }

  submitFeedback() {
    if (!this.form?.valid) {
      return;
    }

    if (!this.askComment) {
      this.checkAskComment();
      if (this.askComment) {
        return;
      }
    }

    this.feedbackService.submitFeedback(this.form.value).pipe(
      finalize(() => this.modalService.closeVoteModal())
    ).subscribe();
  }

  checkAskComment() {
    this.askComment = this.form?.value.rate < this.maxStarsCount && (this.form?.value.comment ?? '').length === 0;
  }

  ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.complete();
  }
}
